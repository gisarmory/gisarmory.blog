# mapboxgl 实现带箭头轨迹线
最近在使用mapboxgl实现轨迹展示时，想实现类似高德地图导航轨迹效果，然而并未在网上找到类似示例。经一番研究与尝试，最终解决，效果如下。

![202012310104](https://blogimage.gisarmory.xyz/202012310104.gif)



添加箭头核心代码如下，只需在配置`layout`中添加`symbol-placement`和`symbol-spacing`属性即可：

```javascript
// 添加箭头图层
function addArrowlayer() {
    map.addLayer({
        'id': 'arrowLayer',
        'type': 'symbol',
        'source': {
            'type': 'geojson',
            'data': routeGeoJson //轨迹geojson格式数据
        },
        'layout': {
            'symbol-placement': 'line',
            'symbol-spacing': 50, // 图标间隔，默认为250
            'icon-image': 'arrowIcon', //箭头图标
            'icon-size': 0.5
        }
    });
}
```



然而，为实现上述效果，确走了不少弯路。曾尝试集成`Leaflet.PolylineDecorator`插件核心算法，通过对线的处理，计算每个箭头所在位置以及角度，也能实现上述效果。不过该方案在地图倾斜旋转后，有时会有箭头偏移的bug。

在解决此bug过程中，不经意间看到道路标注都是沿道路线方向，突然有了新的灵感。

重新查看`mapboxgl API`，发现将`layout`中的`symbol-placement`设置为`line`，即可实现沿着线的方向绘制箭头。

**注意：**

1. 我所用图标为**右侧方向箭头**，结果与实际方向相符，如果图标为向上箭头，需修改`icon-rotate`为90。
2. 只把`symbol-placement`设置为`line`，箭头间距过于稀疏；需要设置下`symbol-spacing`参数，`symbol-spacing`默认值为250，修改为50即可实现文章首页图片效果。


## 在线示例

在线示例：[http://gisarmory.xyz/blog/index.html?demo=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?demo=MapboxGLPolylineDecorator)

代码地址：[http://gisarmory.xyz/blog/index.html?source=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?source=MapboxGLPolylineDecorator)



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)。



关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。


