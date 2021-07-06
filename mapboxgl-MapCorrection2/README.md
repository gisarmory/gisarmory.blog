# mapboxgl 互联网地图纠偏插件（二）

前端时间写的[mapboxgl 互联网地图纠偏插件（一）](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection1)存在地图旋转时瓦片错位的问题。

这次没有再跟 mapboxgl 的变换矩阵较劲，而是另辟蹊径使用 mapboxgl 的自定义图层，重新写了一套加载瓦片的方法来实现地图纠偏。

下面把我这次打怪升级的心路历程分享一下，或许对你也有启发。

文中涉及一些 webgl 的知识细节，没有接触过 webgl 的同学，可以参考看上一次给大家推荐的电子书 [《WebGL编程指南》](https://github.com/linghuam/boutique-books/tree/master/b04-%E5%9B%BE%E5%BD%A2%E5%AD%A6%E4%B8%8E%E5%8F%AF%E8%A7%86%E5%8C%96)，这次再附上一个包含书中所有示例的[ github 库](https://github.com/MrZJD/webgl)，会很有帮助。



## 书接上回

在研究偏移矩阵问题一筹莫展时，发现用天地图的栅格瓦片没有偏移的问题，因为天地图是大地2000坐标，可以直接在 wgs84 坐标地图上使用，基本没有误差。

尝试后觉得，可以倒是可以，但就是配色有点丑，只能先做为一个保底方案，高德瓦片的纠偏还要继续研究。

话说《WebGL编程指南》这本书看完后，一直想写个读书笔记，但又觉得光写笔记太枯燥，就想着结合地图看能干点啥。

mapboxgl 通过自定图层接口支持 webgl 的扩展，这个接口的好处是，对复杂的变换矩阵进行了封装，对外使用大家熟悉的 web 墨卡托坐标，并提供了经纬度坐标和 web墨卡托坐标转换的接口 。

查看 mapboxgl 的官方示例时，突然来了灵感，可以用这个接口自己写个加载栅格瓦片的程序，这样就能绕开 mapboxgl 复杂的框架，更容易实现对瓦片纠偏，出现问题也更好解决，对整体更有掌控感。

技术路线分析：

用这个思路来实现纠偏，要搞定两大问题，一个是如何用 webgl 实现显示瓦片的功能，另一个是如何计算瓦片在屏幕上的显示位置。



## 如何用 webgl 显示瓦片

在 webgl 中，图形的基础是三角形，要绘制正方形的瓦片，需要用两个三角形拼成一个正方形，再把图片贴到这个正方形上，就能实现地图瓦片的显示。这个过程中，图片被称为纹理，贴图被称为纹理贴图。实现效果如下（图片位置是随便写的）：

![](http://blogimage.gisarmory.xyz/20210706120859.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

这里有两点要注意：

1、要注意图片的跨域问题，需要通过设置图片的跨域属性来解决。

![](http://blogimage.gisarmory.xyz/20210706120909.png)

2、要注意顶点坐标的顺序，正确的顺序为：左上、左下、右上、右下，不然图片会像穿衣服一样，各种穿反，前后反，左右反

![](http://blogimage.gisarmory.xyz/20210706120915.png)

核心代码如下：

```js
    var picLoad = false;
    var tileLayer = {
        id: 'tileLayer',
        type: 'custom',

        //添加图层时调用
        onAdd: function (map, gl) {
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
                "    gl_FragColor = texture2D(u_Sampler, v_TextCoord);" +
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
            var program = this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            
            //获取顶点位置变量
            var a_Pos = gl.getAttribLocation(this.program, "a_pos");
            var a_TextCoord = gl.getAttribLocation(this.program, 'a_TextCoord');
            //设置图形顶点坐标
            var leftTop = mapboxgl.MercatorCoordinate.fromLngLat({lng: 110,lat: 40});
            var rightTop = mapboxgl.MercatorCoordinate.fromLngLat({lng: 120,lat: 40});
            var leftBottom = mapboxgl.MercatorCoordinate.fromLngLat({lng: 110,lat: 30});
            var rightBottom = mapboxgl.MercatorCoordinate.fromLngLat({lng: 120,lat: 30});
            //顶点坐标放入webgl缓冲区中
            var attrData = new Float32Array([
                leftTop.x, leftTop.y, 0.0, 1.0,
                leftBottom.x, leftBottom.y, 0.0, 0.0,
                rightTop.x, rightTop.y, 1.0, 1.0,
                rightBottom.x, rightBottom.y, 1.0, 0.0
            ])
            var FSIZE = attrData.BYTES_PER_ELEMENT;
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, attrData, gl.STATIC_DRAW);
            //设置从缓冲区获取顶点数据的规则
            gl.vertexAttribPointer(a_Pos, 2, gl.FLOAT, false, FSIZE * 4, 0);
            gl.vertexAttribPointer(a_TextCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
            //激活顶点数据缓冲区
            gl.enableVertexAttribArray(a_Pos);
            gl.enableVertexAttribArray(a_TextCoord);

            var _this = this;
            var img = this.img = new Image();
            img.onload = () => {
                 // 创建纹理对象
                 _this.texture = gl.createTexture();
                //向target绑定纹理对象
                gl.bindTexture(gl.TEXTURE_2D, _this.texture);
                //对纹理进行Y轴反转
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                //配置纹理图像
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.img);

                picLoad = true;
            };
            img.crossOrigin = true;	//设置允许跨域
            img.src = "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=843&y=386&z=10";
        },

        //渲染，地图界面变化时会调用这个方法,会调用若干次（变化时的每一帧都调用）
        render: function (gl, matrix) {
            if(picLoad){
                //应用着色程序
                //必须写到这里，不能写到onAdd中，不然gl中的着色程序可能不是上面写的，会导致下面的变量获取不到
                gl.useProgram(this.program);

                //向target绑定纹理对象
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
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

                //给位置变换矩阵赋值
                gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_matrix"), false, matrix);
                //绘制图形
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }            
        }
    };

    map.on('load', function () {
        map.addLayer(tileLayer);
    });

```



上面是加载一个瓦片，下面看一下如何加载多个瓦片，这个问题看似简单，但对于webgl不熟悉的同学有可能会走弯路，我自己在研究时，就遇到了下面几个问题：

**第一个问题：**

自定义图层必须要有`onAdd`方法和`render`方法，`onadd`方法在加载图层时会被调用一次，`render`方法在地图平移、缩放、旋转时会被调用若干次，来实现平滑过渡的效果。

那么问题来了，哪些 webgl 代码应该放在`onadd`中，哪些应该放在`render`中？

下面是 [webglfundamentals](https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-fundamentals.html)  网站给出的解释，在这里，`onadd`方法就是初始化阶段，`render`方法就是渲染阶段。

![image-20210705153124421](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20210705153124421.png)



**第二个问题：**

顶点坐标是一个瓦片用一个缓冲区，还是所有坐标都放在一个缓冲区中，然后定义规则来取？

答案是，一个瓦片就是一个独立的图形，一个图形对应一套自己的顶点坐标，坐标后面可以跟渲染相关的属性，如颜色、纹理坐标等，但多个图形的顶点坐标不能放在一起，放一起会被绘制为一个图形。多个图形应该使用多个缓冲区对象分别存储自己的顶点坐标。

**第三个问题：**

如何使用多个缓冲区？

webgl 是面向过程式的，平时用惯了面向对象的开发语言，刚接触这个时有点不适应，后来就慢慢熟悉了。

我们可以把 webgl 的想象成一台老式的机械印刷机，它根据模板印刷，一次只能只使用一个模板，如果想要印刷出多个不同的图案，就需要准备多个不同图案的模板，然后在印刷时不断的更换模板。

webgl 中的着色器、缓冲区对象、纹理对象三者的组合就像是这个模板 ，它们中都包含了绘制图形的参数。更换模板，就是在更换着色器、缓冲区对象和纹理对象，不同的是，相比印刷机，电脑中切换这些只是一瞬间的事情，时间可以忽略不计。

webgl 在实际工作时就是像上面的印刷机一样在不停的更换模板然后印刷，再更换模板再印刷，直到全部图像绘制完成，整个过程也是一瞬间的事情，具体的绘制时间取决于你的电脑性能。

在 webgl 中，”印刷的机器“只有一个，但“模板”你可以创建很多，它的上限取决于你的电脑性能。

我们要做的就是为每一个瓦片创建一个“模板”，然后在绘制时动态切换这些“模板”。

上面三个问题搞明白以后，我成功的加载了2个瓦片。效果图：

![](http://blogimage.gisarmory.xyz/20210706120920.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



## 如何计算瓦片在屏幕上的显示位置

核心还是用的上篇文章中提到的[经纬度和瓦片编号互转算法](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)

原理是：先获取当前显示范围四个角的经纬度，再根据互转算法计算出四个角对应的瓦片编号，这样就能统计出当前地图范围所有瓦片的瓦片编号。

![](http://blogimage.gisarmory.xyz/20210706120925.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

然后遍历当前范围内的所有瓦片编号。

遍历时，根据互转算法，将遍历到的瓦片编号转为瓦片左上角的经纬度，再用右、下、右下方3个瓦片的经纬度，组成瓦片的4个顶点坐标。

在这一步加入对顶点坐标的纠偏算法，实现对瓦片的纠偏。

最后再去监听地图改变的事件，当地图发生平移、缩放、旋转时都要重复上面的计算，更新瓦片。

这里遇到个问题：纠偏后也出现了上一篇中边缘空白的情况。于是对上面的算法优化了一下，在获取到当前显示范围的四个角经纬度坐标后，对这4个坐标也进行纠偏，这样问题就解决了。

现在瓦片的地图的框架搭起来了，也能够浏览查看瓦片地图了，这一刻还是有点小兴奋的

![](http://blogimage.gisarmory.xyz/20210706120929.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

但和最终想要的效果还有些差距，还有很多细节需要优化



## 细节优化

**1、缓存瓦片**

把请求过的瓦片放到存到变量中，这样请求过的瓦片可以避免重复请求，显示速度会更快，体验更好。

**2、缓存网格经纬度**

统一计算瓦片网格的经纬度并缓存起来，以免每次都进行重复计算。

**3、瓦片加载的顺序从中间向四周**

现在的顺序是从左到右，有种刷屏的感觉，需要对瓦片编号排一下序，让靠近中间的先加载，靠近边缘的后加载。

**4、个别瓦片不显示问题**

每次地图范围变换时，为了实现平滑的效果`render`方法会被执行几十次，时间大概在1秒左右，

如果瓦片不能在这期间加载完成，就会被落下，导致不显示。

需要把最后一次执行`render`方法时的`matrix`变换矩阵记录下来，在瓦片加载完成后主动调用`render`方法绘制。

**5、影像图注记白底的问题**

在加载影像图时，影像和注记是分开的，需要叠加显示，注记层在没有文字的地方是透明的。

但叠加到一起以后注记层在本该是透明的地方却是不透明的白色

![](http://blogimage.gisarmory.xyz/20210706120934.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

原因一，因为在读取纹理像素数据时的配置有问题，要使用`gl.RGBA`，如果使用的是`gl.RGB`丢掉了透明度`A`，就会缺失透明度信息，导致不透明。

![](http://blogimage.gisarmory.xyz/20210706120938.png)

原因二，因为在绘制前没有对 webgl 开启阿尔法混合（阿尔法在这里可以理解为透明度），在 webgl 中如果要实现透明效果，这个选项是必须要开启的。

![](http://blogimage.gisarmory.xyz/20210706120941.png)

解决后的效果：

![](http://blogimage.gisarmory.xyz/20210706120944.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

**6、影像图注记白底的问题还是会偶尔出现**

按上一条修改后，白底问题出现的频率明显降低，但偶尔还是会出现。

研究规律，当注记瓦片加载的时间稍长时就会出现，出现后，只要稍稍拖动一下地图就会正常，已经浏览过的区域没有这个问题。

推测，影像和注记是分图层绘制，当个别注记瓦片加载的时间长，去主动调用`render`方法重新绘制时，注记的图层会全部重绘，但影像图层不会绘制，这可能就导致两个图层无法动态的混合。

目前的解决方法是，对于注记图层如果加载慢了，就不主动调用render方法重新绘制了。因为缺一小块注记不影响大局，而且下一步操作时它也会自动变正常。



## 地图抖动问题

一些列优化完成后，现在地图也纠偏了，旋转时也不再错位了，本来以为程序已经很完美了，但当我叠上项目真实数据后，发现了一个很要命的问题，自定义图层在大比例尺时会出现抖动的问题。

这个问题最开始就注意到了，但没太在意，以为影响不大，但叠加上业务数据后，发现根本没法用，那种感觉就像是，坐到了行驶在乡间小路的拖拉机上， ~ 颠 ~ 颠 ~ 颠 ~ 颠 ~  颠 ~  颠 ~  颠 ~ 

![](http://blogimage.gisarmory.xyz/20210706120950.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

起初还以为是瓦片编号和经纬度互转导致的问题，后来发现 mapboxgl 官网的[自定义图层示例](https://www.mapbox.cn/mapbox-gl-js/example/custom-style-layer/)也有这个问题，看来是 mapboxgl 的 bug 无疑了。

帮 mapboxgl  找问题，最终定位在了`render`方法的`matrix`变换矩阵上，这个参数是 mapboxgl 传来的，用于将 web 墨卡托坐标转为 webgl 坐标，并对瓦片进行缩放和旋转。

当只对地图进行微小的平移时，底图会动，`matrix`矩阵却没有变，`matrix`矩阵不变，自定义图层也就不会变，当地图平移的范围加大时，matrix矩阵才会跟着变。

翻看 mapboxgl 的源码，自定义图层和底图用的不是一个变换矩阵，所以只有自定义图层有问题。

尝试了 mapboxgl 的最新版本 v2.3.1 也有这个问题。

唉！ 本来以为纠偏这事儿要翻片儿了，这么看来还要再研究一阵子了。



## 启发、思路、感受

在使用自定义图层的过程中有了一些启发，上篇文章中纠偏写在了变换矩阵中，这种写法在地图旋转时会出现瓦片错位的问题。

本篇文章中纠偏是对`a_pos`变量 web 墨卡托坐标进行纠偏，在旋转时就没有出现错位的情况。

按这个思路，是不是在上篇文章中，也对`a_pos`变量纠偏，地图旋转时就不会出现错位问题了？值得一试。

所以，接下来两个思路：一、研究如何提高自定义图层变换矩阵的精度，让它不再抖动。二、研究如何对 mapboxgl 源码中的`a_pos`变量进行纠偏。

最后说一下使用 mapboxgl 自定义图层的感受，使用 mapboxgl 自定义图层 + webgl 扩展，就感觉打开了GIS世界的另一扇窗户，自己可以去实现各种炫酷高大上的功能了，感觉有了无限可能。



## 代码、示例

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection2](http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection2)

插件代码：[http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection2](http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection2)



## 总结

1. 这次尝试用 maboxgl 的自定义图层功能，自己写了一个加载互联网瓦片的程序，来实现瓦片纠偏
2. 自己写加载瓦片的程序要搞定两大问题，一个是如何用 webgl 实现显示瓦片的功能，二个是如何计算瓦片在屏幕上的显示位置
3.  webgl 显示瓦片的原理就是绘制个正方形再给正方形贴图片纹理
4. 计算瓦片在屏幕上的显示位置，核心是使用瓦片号和经纬度的互转算法，在这个过程中对瓦片进行纠偏
5. 还要进行一些细节优化，比如瓦片的加载顺序等
6. 最终实现了对高德瓦片进行纠偏，并且旋转时也不会出现错位的情况
7. 这种方式有个问题，mapboxgl 的`render`方法中传过来的变换矩阵的精度不够，在大比例尺时会出现瓦片抖动的情况，这应该是mapboxgl 的 bug
8. 在使用自定义图层的过程中有了一些启发，接下来两个思路：一、研究如何提高自定义图层变换矩阵的精度。二、研究如何对mapboxgl 源码中的`a_pos`变量进行纠偏。
9. 目前的保底方案是使用天地图的瓦片，高德地图的瓦片还要继续研究。

<br>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection2](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection2)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 只给你网上搜不到的GIS知识技能。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





