import {lonLatToTileNumbers, tileNumbersToLonLat, gcj02_To_gps84, gps84_To_gcj02} from './coordConver.js'
import {setOptions, template} from './Util.js'

export default class gcj02TileLayer{

    constructor(layerId, url, options){
        this.id = layerId;
        this.type = "custom";
        this.renderingMode = '2d';
        this.url = url;

        this.options = {

            //服务器编号
            subdomains: null,

            //在瓦片加载完成后，是否主动去更新渲染。
            //如果是包含透明区域的瓦片，建议设置为false，如影像注记瓦片。
            //当瓦片因为网络原因，在render方法不再主动后，才加载完成，这时去主动调用render方法，
            //其中用于实现注记半透明效果的阿尔法混合会不起作用，瓦片透明区域会变成不透明的白色
            imgLoadRender:true,
            
            minZoom:3,
            maxZoom:18
        }
        setOptions(this, options)   //合并属性

        //着色器程序
        this.program;

        //存放当前显示的瓦片
        this.showTiles = []

        //存放所有加载过的瓦片
        this.tileCache = {}

        //存放瓦片号对应的经纬度
        this.gridCache = {}

        //记录渲染时的变换矩阵。
        //如果瓦片因为网速慢，在渲染完成后才加载过来，可以使用这个矩阵主动更新渲染
        this.matrix;

        this.map;

    }


    onAdd(map, gl) {
        this.map = map;

        var vertexSource = "" +
            "uniform mat4 u_matrix;" +
            "attribute vec2 a_pos;" +
            "attribute vec2 a_TextCoord;" +
            "varying vec2 v_TextCoord;" +
            "void main() {" +
            "   gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);" +
            "   v_TextCoord = a_TextCoord;" +
            "}";

        var fragmentSource = "" +
            "precision mediump float;" +
            "uniform sampler2D u_Sampler; " +
            "varying vec2 v_TextCoord; " +
            "void main() {" +
            "   gl_FragColor = texture2D(u_Sampler, v_TextCoord);" +
            // "    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);" +
            "}";

        //初始化顶点着色器
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        //初始化片元着色器
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        //初始化着色器程序
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        //获取顶点位置变量
        this.a_Pos = gl.getAttribLocation(this.program, "a_pos");
        this.a_TextCoord = gl.getAttribLocation(this.program, 'a_TextCoord');


        map.on('move', ()=>{
            this.update(gl, map)
        })
        this.update(gl, map)
    }

    update(gl, map){
        var center = map.getCenter();
        var zoom = parseInt(map.getZoom())+1;
        var bounds = map.getBounds();

        //把当前显示范围做偏移，后面加载瓦片时会再偏移回来
        //如果不这样做的话，大比例尺时，瓦片偏移后，屏幕边缘会有空白区域
        var northWest = gps84_To_gcj02(bounds.getNorthWest())
        var southEast = gps84_To_gcj02(bounds.getSouthEast())

        //算出当前范围的瓦片编号
        var minTile = lonLatToTileNumbers(northWest.lng, northWest.lat, zoom)
        var maxTile = lonLatToTileNumbers(southEast.lng, southEast.lat, zoom)
        var currentTiles = [];
        for(var x=minTile[0]; x<=maxTile[0]; x++){
            for(var y=minTile[1]; y<=maxTile[1]; y++){
                var xyz = {
                    x:x,
                    y:y,
                    z:zoom
                }
                currentTiles.push(xyz)
               
                //把瓦片号对应的经纬度缓存起来，
                //存起来是因为贴纹理时需要瓦片4个角的经纬度，这样可以避免重复计算
                //行和列向外多计算一个瓦片数，这样保证瓦片4个角都有经纬度可以取到
                this.addGridCache(xyz, 0, 0)
                if(x === maxTile[0] ) this.addGridCache(xyz, 1, 0)
                if(y===maxTile[1]) this.addGridCache(xyz, 0, 1)
                if(x === maxTile[0] && y===maxTile[1]) this.addGridCache(xyz, 1, 1)
            }
        }

        //瓦片设置为从中间向周边的排序
        var centerTile = lonLatToTileNumbers(center.lng, center.lat, zoom)  //计算中心点所在的瓦片号
        currentTiles.sort((a, b)=>{
			return this.tileDistance(a, centerTile) - this.tileDistance(b, centerTile);
		});

        //加载瓦片
        this.showTiles = [];
        for(var xyz of currentTiles){
            //走缓存或新加载
            if(this.tileCache[this.createTileKey(xyz)]){
                this.showTiles.push(this.tileCache[this.createTileKey(xyz)])
            }else{
                var tile = this.createTile(gl, xyz)
                this.showTiles.push(tile);
                this.tileCache[this.createTileKey(xyz)] = tile;
            }
        }
    }

    //缓存瓦片号对应的经纬度
    addGridCache(xyz, xPlus, yPlus){
        var key = this.createTileKey(xyz.x+xPlus, xyz.y+yPlus, xyz.z)
        if(!this.gridCache[key]){
            this.gridCache[key] = gcj02_To_gps84(tileNumbersToLonLat(xyz.x+xPlus, xyz.y+yPlus, xyz.z))
        }
    }

    //计算两个瓦片编号的距离
    tileDistance(tile1, tile2){
        //计算直角三角形斜边长度，c（斜边）=√（a²+b²）。（a，b为两直角边）
        return Math.sqrt(Math.pow((tile1.x - tile2[0]),2)+ Math.pow((tile1.y - tile2[1]),2))
    }

    //创建瓦片id
    createTileKey(xyz, y, z){
        if(xyz instanceof Object){
            return xyz.z+'/'+xyz.x+'/'+xyz.y;
        }else{
            var x = xyz;
            return z+'/'+x+'/'+y;
        }
    }

    //创建瓦片
    createTile(gl, xyz){
        //替换请求地址中的变量
        var _url = template(this.url, {
            s:this.options.subdomains[Math.abs(xyz.x + xyz.y) % this.options.subdomains.length],
            x:xyz.x,
            y:xyz.y,
            z:xyz.z
        });

        var tile = {
            xyz:xyz
        };

        //瓦片编号转经纬度，并进行偏移
        var tLeftTop = this.gridCache[this.createTileKey(xyz)]
        var tRightTop = this.gridCache[this.createTileKey(xyz.x+1, xyz.y, xyz.z)] 
        var tLeftBottom = this.gridCache[this.createTileKey(xyz.x, xyz.y+1, xyz.z)]  
        var tRightBottom = this.gridCache[this.createTileKey(xyz.x+1, xyz.y+1, xyz.z)]  
        //设置图形顶点坐标
        var leftTop = mapboxgl.MercatorCoordinate.fromLngLat(tLeftTop);
        var rightTop = mapboxgl.MercatorCoordinate.fromLngLat(tRightTop);
        var leftBottom = mapboxgl.MercatorCoordinate.fromLngLat(tLeftBottom);
        var rightBottom = mapboxgl.MercatorCoordinate.fromLngLat(tRightBottom);
        //顶点坐标+纹理坐标
        var attrData = new Float32Array([
            leftTop.x, leftTop.y, 0.0, 1.0,
            leftBottom.x, leftBottom.y, 0.0, 0.0,
            rightTop.x, rightTop.y, 1.0, 1.0,
            rightBottom.x, rightBottom.y, 1.0, 0.0
        ])
        var FSIZE = attrData.BYTES_PER_ELEMENT;
        //创建缓冲区并传入数据
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, attrData, gl.STATIC_DRAW);
        tile.buffer = buffer;
        //从缓冲区中获取顶点数据的参数
        tile.PosParam = {
            size:2,
            stride:FSIZE * 4,
            offset:0
        }
        //从缓冲区中获取纹理数据的参数
        tile.TextCoordParam = {
            size:2,
            stride:FSIZE * 4,
            offset:FSIZE * 2
        }

        //加载瓦片
        var img = new Image();
        img.onload = () => {
            // 创建纹理对象
            tile.texture = gl.createTexture();
            //向target绑定纹理对象
            gl.bindTexture(gl.TEXTURE_2D, tile.texture);
            //对纹理进行Y轴反转
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            //配置纹理图像
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            tile.isLoad = true;

            //瓦片加载完成后主动绘制
            if(this.options.imgLoadRender){
                this.render(gl, this.matrix)
            }
        };
        img.crossOrigin = true;     //允许图片跨域
        img.src = _url;

        return tile;
    }


    //渲染
    render(gl, matrix) {

        if(this.map.getZoom() < this.options.minZoom || this.map.getZoom() > this.options.maxZoom) return

        //记录变换矩阵，用于瓦片加载后主动绘制
        //这里有个mapboxgl的bug，就是matrix的精度不够，会导致在大比例尺下（17、18级最明显）出现瓦片抖动的情况
        this.matrix = matrix;

        //应用着色程序
        //必须写到这里，不能写到onAdd中，不然gl中的着色程序可能不是上面写的，会导致下面的变量获取不到
        gl.useProgram(this.program);

        for(var tile of this.showTiles){
            if(!tile.isLoad) continue;

            //向target绑定纹理对象
            gl.bindTexture(gl.TEXTURE_2D, tile.texture);
            //开启0号纹理单元
            gl.activeTexture(gl.TEXTURE0);
            //配置纹理参数
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            // 获取纹理的存储位置
            var u_Sampler = gl.getUniformLocation(this.program, 'u_Sampler');
            //将0号纹理传递给着色器
            gl.uniform1i(u_Sampler, 0);


            gl.bindBuffer(gl.ARRAY_BUFFER, tile.buffer);
            //设置从缓冲区获取顶点数据的规则
            gl.vertexAttribPointer(this.a_Pos, tile.PosParam.size, gl.FLOAT, false, tile.PosParam.stride, tile.PosParam.offset);
            gl.vertexAttribPointer(this.a_TextCoord, tile.TextCoordParam.size, gl.FLOAT, false, tile.TextCoordParam.stride, tile.TextCoordParam.offset);
            //激活顶点数据缓冲区
            gl.enableVertexAttribArray(this.a_Pos);
            gl.enableVertexAttribArray(this.a_TextCoord);

            //给位置变换矩阵赋值
            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_matrix"), false, matrix);

            //开启阿尔法混合，实现注记半透明效果
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            //绘制图形
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

    }

}