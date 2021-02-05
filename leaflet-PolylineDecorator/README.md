# Leaflet 实现带箭头轨迹线，动态轨迹回放
前面写了篇文章，[mapboxgl实现带箭头轨迹线](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)，介绍了如何基于mapboxgl实现类似高德地图导航轨迹效果。在此，我们再基于Leaflet实现该效果。leaflet无法像`mapboxgl`似的直接通过样式实现轨迹箭头效果，需要通过引用`L.polylineDecorator`扩展实现。

效果如下：

![202101280101](F:\myself\gisarmory\Leaflet.PolylineDecorator\202101280101.gif)



添加箭头效果主要用的是`L.polylineDecorator`扩展，核心代码如下

![202010100202](http://blogimage.gisarmory.xyz/202010100202.png)

实现动态播放效果主要参考`Leaflet.AnimatedMarker`，不过该插件未实现图标角度随轨迹变化，在此，我们添加了图标旋转的代码：

1. 将轨迹线打断，以便可以平滑播放，核心代码如下

   ![20210127140716](F:\myself\gisarmory\Leaflet.PolylineDecorator\20210127140716.png)

2. 动态播放时获取播放图标旋转角度，通过修改`marker`样式实现小车方向始终按轨迹方向行驶。核心代码如下

   ![20210127141124](F:\myself\gisarmory\Leaflet.PolylineDecorator\20210127141124.png)



## 在线示例

在线示例：[http://gisarmory.xyz/blog/index.html?demo=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?demo=MapboxGLPolylineDecorator)

代码地址：[http://gisarmory.xyz/blog/index.html?source=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?source=MapboxGLPolylineDecorator)

## 参考内容

https://github.com/bbecquet/Leaflet.PolylineDecorator

https://github.com/openplans/Leaflet.AnimatedMarker

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)。



关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。

