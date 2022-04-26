# mapboxgl 中插值表达式的应用场景

[TOC]

## 一、前言

`interpolate`是mapboxgl地图样式中用于插值的表达式，能对颜色和数字进行插值。

它的应用场景有两类：

1、对地图数据进行颜色拉伸渲染。

常见的应用场景有：热力图、轨迹图、模型网格渲染等。

2、在地图缩放时对图形属性进行插值。

具体为，随着地图的缩放，在改变图标大小、建筑物高度、图形颜色等属性时，对属性进行插值，从而实现平滑的过渡效果。

这篇文章就把 mapboxgl 中`interpolate`插值工具的常见应用场景介绍一下。

## 二、语法

先看一下`interpolate`插值工具的语法。

`interpolate`表达式要求至少有5个参数，分别是`表达式名称`、`插值类型`、`输入值`、`判断值`、`输出值`。

```js
["interpolate",		//表达式名称
    interpolation: ["linear"] | ["exponential", base] | ["cubic-bezier", x1, y1, x2, y2 ],  //插值类型
    input: number,	//输入值
    stop_input_1: number, stop_output_1: OutputType,		//一组判断值和输出值
    stop_input_n: number, stop_output_n: OutputType, ...	//一组判断值和输出值
]: OutputType (number, array<number>, or Color)		//返回插值完的结果
```

其中`插值类型`会在后面详细介绍，这里先不多说。

`判断值`、`输出值`是“一组”的关系，它们必须两两出现。

还有一点需要注意，就是`判断值`必须遵循**升序**规则。

下面我们结合实际场景理解起来会更容易一些。



## 三、对地图颜色进行拉伸渲染

这个和ArcGIS中对栅格数据进行颜色拉伸渲染是一个意思。

地图颜色拉伸渲染的本质，是根据网格的属性值为网格设置颜色，当网格足够小、足够密时，就容易产生颜色平滑过渡的效果。

前面说到，常见的应用场景有：热力图、轨迹图、模型网格渲染等。

在mapboxgl中，热力图和轨迹图它们虽然看上去不像是由网格组成的，但在计算机图形学的框架下，任何在屏幕上显示的内容，都是由像素来呈现的，而像素是规律排列的网格，所以可以把热力图和轨迹也看成是由网格组成的。

这一点在WebGL开发时尤为明显，因为需要自己写片元着色器定义每个像素的颜色。



mapboxgl提供了热力图和轨迹图的像素属性值计算工具：

- 热力图中为`heatmap-density`表达式，用来计算热力图上每个像素的热力值。

- 轨迹线中为`line-progress`表达式，用来计算在当前线段上行进的百分比。

模型网格渲染时，网格需要自己生成，网格中的属性值也需要自己计算，通常在项目上这些是由模型完成的，如：EFDC水动力模型、高斯烟羽大气污染扩散模型等。

模型输出的结果就是带属性值的网格，`interpolate`表达式的任务仍然是根据网格的属性值为网格设置颜色。



### 2.1 热力图

实现效果：

![](http://blogimage.gisarmory.xyz/20220426163359.png)



数据使用的是北京市公园绿地无障碍设施数量。

代码为：

```js
//添加图层
map.addLayer({
    "id": "park",
    "type": "heatmap",
    "minzoom": 0,
    "maxzoom": 24,
    "source": "park",
    "paint": {
        "heatmap-weight": 1,
        "heatmap-intensity": 1,
        'heatmap-opacity':0.4,
        'heatmap-color': [//热力图颜色
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,'rgba(255,255,255,0)',
            0.2,'rgb(0,0,255)',
            0.4, 'rgb(117,211,248)',
            0.6, 'rgb(0, 255, 0)',
            0.8, 'rgb(255, 234, 0)',
            1, 'rgb(255,0,0)',
        ]
    }
});
```

上述代码中，使用`interpolate`表达式进行线性插值，输入值是`heatmap-density`热力图密度，热力图密度的值在0-1之间，输出值是热力图中各个像素的颜色。

```js
'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,'rgba(255,255,255,0)',
    0.2,'rgb(0,0,255)',
    0.4, 'rgb(117,211,248)',
    0.6, 'rgb(0, 255, 0)',
    0.8, 'rgb(255, 234, 0)',
    1, 'rgb(255,0,0)',
]
```

**表达式详解：**

- 密度为`0或小于0`，输出颜色`'rgba(255,255,255,0)'`
- 密度为`0-0.2`，输出颜色在`'rgba(255,255,255,0)'`和`'rgb(0,0,255)'`之间
- 密度为`0.2`，输出颜色`'rgb(0,0,255)'`
- 密度为`0.2-0.4`，输出颜色在`'rgb(0,0,255)'`和`'rgb(117,211,248)'之间`
- 密度为`0.4`，输出颜色`'rgb(117,211,248)'`
- 密度为`0.4-0.6`，输出颜色在`'rgb(117,211,248)'`和`'rgb(0, 255, 0)'`之间
- 密度为`0.6`，输出颜色`'rgb(0, 255, 0)'`
- 密度为`0.6-0.8`，输出颜色在`'rgb(0, 255, 0)'`和`'rgb(255,0,0)'`之间
- 密度为`0.8`，输出颜色`'rgb(255, 234, 0)'`
- 密度为`0.8-1`，输出颜色在`'rgb(255, 234, 0)'`和`'rgb(255,0,0)'`之间
- 密度为`1或大于1`，输出颜色`'rgb(255,0,0)'`

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate1](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate1)

> 和使用`interpolate` 表达式对数据进行颜色拉伸渲染对应的另一种渲染方式，是使用`step`表达式对数据进行颜色分类渲染。
>
> 颜色分类渲染的实现方式在上面示例的代码中就有，只是被注释了，可以把代码下载下来自行尝试。
>
> 实现效果如下：
>
> ![](http://blogimage.gisarmory.xyz/20220426163407.png)
>
> 

### 2.2 轨迹图

mapboxgl官网上提供了一个[示例](https://www.mapbox.cn/mapbox-gl-js/example/line-gradient/)，是用颜色来表达轨迹行进的进度，效果图如下：

![](http://blogimage.gisarmory.xyz/20220426163421.png)

它是用线的`line-gradient`属性来实现的，其中用到了插值表达式`interpolate`和线进度表达式`line-progress`，`interpolate`表达式在这里的作用依旧是对属性值进行颜色拉伸渲染，代码如下：

```js
map.addLayer({
    type: 'line',
    source: 'line',
    id: 'line',
    paint: {
        'line-color': 'red',
        'line-width': 14,
        // 'line-gradient' 必须使用 'line-progress' 表达式实现
        'line-gradient': [    //
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, "blue",
            0.1, "royalblue",
            0.3, "cyan",
            0.5, "lime",
            0.7, "yellow",
            1, "red"
        ]
    },
    layout: {
        'line-cap': 'round',
        'line-join': 'round'
    }
});
```

在实际项目中，这种用颜色表达轨迹进度的场景相对少见，更多时候我们需要用颜色来表示轨迹的速度。

**用颜色表示轨迹速度：**

我们准备了一条骑行轨迹数据，轨迹由多个线段组成，每个线段上包含开始速度、结束速度和平均速度属性，相邻的两条线段，在前一条线段的结束点和下一条线段的开始点上，经纬度和速度相同。

```js
//line数据中的单个线段示例
{
    "type": "Feature",
        "properties": {
            "startSpeed": 8.301424026489258, //开始速度
            "endSpeed": 9.440339088439941, //结束速度
            "speed": 8.8708815574646 //平均速度
        },
        "geometry": {
            "coordinates": [
                [
                    116.29458653185719,
                    40.08948061960585
                ],
                [
                    116.29486002031423,
                    40.08911413450488
                ]
            ],
                "type": "LineString"
        }
}
```

最简单的实现方式就是，根据线段的平均速度，给每条线段设置一个颜色。

实现方式仍然是使用`interpolate`表达式，用它来根据轨迹中线段的速度对颜色进行插值。

核心代码如下：

```js
//添加图层
map.addLayer({
    type: 'line',
    source: 'line',
    id: 'line',
    paint: {
        'line-color': [
            'interpolate',//表达式名称
            ["linear"],//表达式类型，此处是线性插值
            ["get", "speed"],//输入值，此处是属性值speed
            0,'red',//两两出现的判断值和输出值
            8,'yellow',
            10,'lime'
        ],
        'line-width': 6,
        'line-blur': 0.5
    },
    layout: {
        'line-cap': 'round'
    }
});
```

上面代码中，`interpolate`表达式的意思是：

- `0km/h及以下(含0km/h)`输出`红色`
- `0-8km/`h输出`红到黄之间的颜色`
- `8km/h`输出`黄色`
- `8-10km/h`输出`黄到绿之间的颜色`
- `10km/h及以上(含10km/h)`输出`绿色`

实现效果如下：

![](http://blogimage.gisarmory.xyz/20220426163432.png)

示例在线地址：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate2](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate2)

整体看上去还不错，但放大地图时会发现，颜色是一段一段的，过渡不够平滑，如下图：

![](http://blogimage.gisarmory.xyz/20220426163437.png)

如何能让局部的颜色也平滑起来呢？

要是能让两个线段间的颜色平滑过渡就好了。

想到这里，我们又想起了前面那个用颜色表示轨迹进度的官方示例，如何把两种方式结合一下或许能实现想要的效果。

**实现思路：**

每条线段的属性中有`开始速度`和`结束速度`，根据颜色和速度的对应关系，可以插值每条线段的`开始颜色`和`结束颜色`，前一条线段的`开始颜色`和后一条线段的`结束颜色`为同一个颜色，每条线段中间的颜色通过使用`line-gradient`实现从`开始颜色`到`结束颜色`的渐变。

这样就能实现两个线段间颜色的平滑过渡了。

> 本来是想在mapboxgl中，通过多个表达式的嵌套来实现的，这样代码会比较简洁，但多次尝试发现行不通，原因是按上面的思路需要进行两次插值，第一次插值是插值出每个线段的`开始颜色`和`结束颜色`，第二次是插值出每个线段上每个像素的颜色，因为mapboxgl对`line-gradient`和`line-progress`在的使用上的一些限制，所以第一次插值的逻辑需要自己动手实现。

**实现方法：**

第一步，写个能插值出每个线段的`开始颜色`和`结束颜色`的函数，实现方式注释里面已经写的比较清楚了。


```js
//通过canvas获取开始颜色和结束颜色：
//原理是利用canvas创建一个线性渐变色对象，再通过计算颜色所在的位置去用getImageData获取颜色，最后返回这个颜色
//1.创建canvas
var canvas = document.createElement("canvas");
canvas.width = 101;
canvas.height = 1;
var ctx = canvas.getContext('2d');
//2.创建线性渐变的函数，该函数会返回一个线性渐变对象，参数0,1,101,1分别指：渐变的起始点x，y和渐变的终止点x，y
var grd = ctx.createLinearGradient(0,1,101,1) 
//3.给线性渐变对象添加颜色点的函数，参数分别是停止点、颜色
grd.addColorStop(0,'red');
grd.addColorStop(0.8,'yellow');
grd.addColorStop(1,'lime');
//4.给canvas填充渐变色
ctx.fillStyle = grd;
ctx.fillRect(0, 0, 101, 1);
//5.返回渐变色的函数
function getInterpolateColor(r) {
    //6.这里是渐变色的精细度，我将canvas分成101份来取值，每一份都会有自己对应的颜色
    //声明的变量x就是我们需要的颜色在渐变对象上的位置
    let x =  parseInt(r * 100);
    x>100?x=100:x=x
    //7.传入插值颜色所在的位置x，通过canvas的getImageData方法获取颜色
    var colorData = ctx.getImageData(x, 0, 1, 1).data;
    //8.返回这个颜色
    return `rgba(${colorData[0]},${colorData[1]},${colorData[2]},${colorData[3]})`
}
```

第二步，每个线段设置为一个图层，每个图层调用第一步的方法获取线段的`开始颜色`和`结束颜色`，然后使用`line-gradient`属性设置线段中间的颜色。

```js
//allFeatures是line数据中单个线段组成的集合
allFeatures.map((item,index)=>{
    //通过上面的渐变色函数获取开始颜色和结束颜色
    let startColor = getInterpolateColor(item.properties.startSpeed/10)
    let endColor = getInterpolateColor(item.properties.endSpeed/10)
    //循环添加图层
    map.addLayer({
        type: 'line',
        source: 'line',
        id: 'line'+index,
        paint: {
            'line-width': 6,
            'line-blur': 0.5,
            'line-gradient': [
                'interpolate',
                ['linear'],
                ['line-progress'],
                0, startColor,
                1, endColor
            ]
        },
        layout: {
            'line-cap': 'round',
        },
        'filter': ['==', "$id", index]
    });
})
```
> 每个线段设置为一个图层，最后可能会有上千个图层，这样不容易管理。
>
> 这里提供另一种思路，可以将所有线段合并为一个线段，然后计算出合并后的折线上每个节点的速度、颜色和占整个轨迹的百分比，占整个轨迹的百分比通过节点距离起点和终点的长度来计算。
>
> 将所有节点的百分比和颜色两两对应作为`line-gradient`的判断参数，就能避免添加过多图层。
>
> 这种方式的缺点是需要处理数据，具体适合用哪种可以根据实际情况来定。

最终实现效果如下：

![](http://blogimage.gisarmory.xyz/20220426163453.png)



示例在线地址：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate3](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleInterpolate3)



### 2.3 模型网格渲染

这种模式下，网格数据主要来自模型输出结果，在输出结果的基础上，只需要用`interpolate`插值工具，根据网格属性值插值出网格颜色就ok。

下面的代码和效果图，是用EFDC模型的输出结果做的示例，这个网格相对比较大一些，但中间部分的过渡还算自然。

代码：

```js
//图层
{
    "id": "waterTN",
    "type": "fill",
    "source": "efdc",
    "paint": {
        "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "TN"],//输入值是属性TN
            0, "#36D1DC",
            15, "#6666ff",
            20, "#4444FF"
        ]
    }
}
```



效果图：

![](http://blogimage.gisarmory.xyz/20220426163500.png)



## 三、**随着地图缩放对图形属性进行插值**

mapboxgl官网给出了两个相关示例：

一个是[按照缩放级别改变建筑颜色](https://www.mapbox.cn/mapbox-gl-js/example/change-building-color-based-on-zoom-level/)，里面同时对建筑物的颜色和透明度进行了插值。

相关代码：

```js
map.setPaintProperty('building', 'fill-color', [
    "interpolate",
    ["exponential", 0.5],
    ["zoom"],
    15,
    "#e2714b",
    22,
    "#eee695"
]);

map.setPaintProperty('building', 'fill-opacity', [
    "interpolate",
    ["exponential", 0.5],
    ["zoom"],
    15,
    0,
    22,
    1
]);
```

效果图：

![缩放改变颜色3](http://blogimage.gisarmory.xyz/20220426163515.gif)

另一个是[按照地图缩放级别去改变建筑物显示高度](https://www.mapbox.cn/mapbox-gl-js/example/3d-buildings/)，里面对建筑物的高度和建筑物距离地图的高度进行了插值。

相关代码：

```js
map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
            "interpolate", ["linear"],
            ["zoom"],
            15, 0,
            15.05, ["get", "height"]
        ],
        'fill-extrusion-base': [
            "interpolate", ["linear"],
            ["zoom"],
            15, 0,
            15.05, ["get", "min_height"]
        ],
        'fill-extrusion-opacity': .6
    }
}, labelLayerId);
```

效果图：

![缩放改变高度](http://blogimage.gisarmory.xyz/20220426163533.gif)

同理，我们还可以对地图图标的大小进行插值，比如缩放级别越大图标越大，缩放级别越小图标越小等。

## 四、interpolate的高阶用法

前面介绍插值工具`interpolate`的语法时，暂时没有介绍`插值类型`这个选项，这一节我们好好说说它。

前面的多数示例中，`插值类型`选项我们都是使用的`['linear']`这个类型，意思是线性插值。

除了线性插值外，`插值类型`还支持`["exponential",base]`指数插值和`["cubic-bezier", x1, y1, x2, y2]`三次贝赛尔曲线插值。

它们的语法为：

- `["linear"]`线性插值，没有其它参数。
- `["exponential",base]`指数插值，`base`参数为指数值。
- `["cubic-bezier",x1,y1,x2,y2]`三次贝塞尔曲线插值，`x1`、`y1`、`x2`、`y2`4个参数用于控制贝塞尔曲线的形态。



听上去可能有点抽象，我们举个例子：

下面这段的代码是根据地图缩放级别改变建筑物的透明度：

```js
map.setPaintProperty('building', 'fill-opacity', [
    "linear",
    ["exponential", 0.5],
    ["zoom"],
    15,0,
    22,1
]);
```

意思为：

- 当缩放级别小于15时，透明度为0。
- 当缩放级别大于等于22时，透明度为1。

- 当缩放级别在15到22之间时，使用线性插值方式自动计算透明度的值，介于0到1之间。




**线性插值：**

如果把缩放级别设置为x，透明度为y，限定x的值在15到22之间，则线性插值的方程式为：

y=(x-15)/(22-15)

从下面的函数图像上可以直观的看出，它就是一条直线，这意味着地图放大时，从15级开始到22级，建筑物不透明度会匀速的增加，直到完全显示。

![](http://blogimage.gisarmory.xyz/20220426163548.png)



**指数插值**：

指数插值的方程式在线性插值方程式的基础上增加了指数值，这个值我们用z来表示，方程式为：

y=((x-15)/(22-15))^z

通过z值来我们可以调整函数图像的形态，如：分别取z值为0.1、0.5、1、2、10这5个值，画成图如下：

![](http://blogimage.gisarmory.xyz/20220426163601.png)

以上图中指数为10次方的紫色线为例，当地图从15级放大到19级时，会一直都看不到建筑物，因为建筑物的透明度一直为0。

继续放大，从19级放大到22级时，建筑物会快速的显现直到完全显示。

这就是指数插值和线性插值的区别，它提供给了我们一个可以**控制插值输出快慢**的方式。



**三次贝塞尔曲线插值：**

三次贝塞尔曲线插值和上面的指数插值是一个意思，都是为了能够更灵活的控制插值输出的快慢。

还是通过函数图像来帮助理解，指数插值的图像只能向一个方向弯曲，指数在0-1之间时曲线向上弯曲，大于1时曲线向下弯曲。

而三次贝塞尔曲线插值则可以让曲线双向弯曲。

mapboxgl官网提供了一个[海洋深度](https://docs.mapbox.com/mapbox-gl-js/example/style-ocean-depth-data/)的示例，里面有用到三次贝塞尔曲线插值。

示例中使用三次贝塞尔曲线对表示海洋深度的颜色进行插值，效果如下图：

![](http://blogimage.gisarmory.xyz/20220426163609.png)

相关代码如下：

```js
{
    'id': '10m-bathymetry-81bsvj',
    'type': 'fill',
    'source': '10m-bathymetry-81bsvj',
    'source-layer': '10m-bathymetry-81bsvj',
    'layout': {},
    'paint': {
    'fill-outline-color': 'hsla(337, 82%, 62%, 0)',
    'fill-color': [
        'interpolate',
        ['cubic-bezier', 0, 0.5, 1, 0.5],
        ['get', 'DEPTH'],
        200,'#78bced',
        9000,'#15659f'
        ]
    }
},
```

上面代码中，三次贝塞尔曲线插值的4个参数`x1`、`y1`、`x2`、`y2`的值分别为：0、 0.5、 1、 0.5。

它的函数图像为：

![](http://blogimage.gisarmory.xyz/20220426163636.png)

通过上图可以看出，函数输出的速度是 **先快 再慢 最后又快**，结合海洋深度的示例，当深度在`200`米和`9000`米附近时，颜色变化较快，深度在中间时，颜色变化比较平缓。下面两张图是线性插值和三次贝塞尔曲线插值的对比：

![](http://blogimage.gisarmory.xyz/20220426163641.png)

上图使用`["linear"]`线性插值，颜色匀速输出，能看出深浅变化，但是‘块状感’明显

下图使用 ['cubic-bezier', 0, 0.5, 1, 0.5]三次贝塞尔曲线插值，颜色输出先快再慢最后又快，既能看出深浅变化，又能实现自然过渡的平滑效果，会让人感觉更柔和。

![](http://blogimage.gisarmory.xyz/20220426163648.png)

> 推荐文章[一篇通俗易懂的三次贝塞尔曲线讲解](https://www.cnblogs.com/joyho/articles/5817170.html)可以了解三次贝塞尔曲线是怎么画出来的，还有一个[工具网站](https://www.tweenmax.com.cn/tool/bezier/)可以自己画点帮助理解。
>
> 这三种插值方法所代表的函数都可以在坐标轴中画出来，无论画出来是直线还是各种曲线，我们都不需要去纠结这个线条是如何画的，因为这一步我们可以借助工具来完成，需要关心的是这条线它**输出速度的快慢**，这才和我们`"interpolate"`表达式的意义**平滑过渡**相关。





## 五、总结

1. `interpolate`是mapboxgl地图样式中用于插值的表达式，能对颜色和数字进行插值，可以让地图实现平滑的过渡效果。
2. 它的应用场景有两类，一类是对地图数据进行颜色拉伸渲染，如：热力图、轨迹图、模型网格渲染等。
3. 另一类是在地图缩放时对图形属性进行插值，如：随着地图的缩放实现建筑物高度的缓慢变化、图形颜色的平滑切换等效果。
4. `interpolate`插值工具提供了三种插值方式，线性插值、指数插值、三次贝塞尔曲线插值，它们的区别在于控制插值输出快慢的不同。

<br>
* * *


原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleInterpolate](http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleInterpolate)



欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》



![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接： [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。

