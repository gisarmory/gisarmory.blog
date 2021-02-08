# Leaflet 带箭头轨迹以及沿轨迹带方向的动态marker
前面写了篇文章，[mapboxgl实现带箭头轨迹线](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)，介绍了如何基于mapboxgl实现类似高德地图导航轨迹效果。

下图是我基于leaflet实现的效果。

![202101280101](https://blogimage.gisarmory.xyz/202101280101.gif)

接下来分享一下在我基于leaflet实现该效果时一些思路以及踩到的坑。

### 轨迹线添加箭头效果

leaflet无法像`mapboxgl`似的直接通过样式实现轨迹箭头效果，需要通过引用[L.polylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator)扩展实现。核心代码如下。

注意：此处添加箭头图层应在轨迹线和实时轨迹线之后，不然箭头会被覆盖。

![20210204103224](https://blogimage.gisarmory.xyz/20210204103224.png)



### 沿轨迹线带方向动态marker

实现该效果首先想到的是类似之前在用mapboxgl 实现的思路，将线打断，然后通过[requestAnimationFrame](https://blog.csdn.net/vhwfr2u02q/article/details/79492303)循环更新marker的位置和角度实现；这种方式最终可以实现动态效果，但是流畅度差了一些，会有卡顿的现象。

为了得到更流畅的效果，又翻看[Leaflet Plugins](https://leafletjs.com/plugins.html)，搜索`animate`关键字，发现了[Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker)，动画效果挺流畅的，于是拉取代码研究了一下。

该插件主要是使用CSS3动画来实现marker在线段间的移动，所以效果比较流畅。

但是该插件并未考虑marker角度的问题，而且在做地图缩放的时候会有`marker`偏移轨迹的问题。查找相关资料时，发现有人也尝试解决此问题[leaflet-moving-marker](https://github.com/mohsen1/leaflet-moving-marker)。

但这里对于轨迹线的动态绘制并未考虑。

参考[Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker)、[leaflet-moving-marker](https://github.com/mohsen1/leaflet-moving-marker)中核心代码并考虑我们要实现的效果，最终解决了角度问题以及轨迹线动态绘制问题。

![20210208152058](https://blogimage.gisarmory.xyz/20210208152058.png)

另外，在播放过程中当前后两个点位角度变化超过180度时，会出现`marker`旋转的问题。

![202102080101](https://blogimage.gisarmory.xyz/202102080101.gif)

通过如下代码我们解决了此问题。

![20210208152905](https://blogimage.gisarmory.xyz/20210208152905.png)

我们把代码重新封装，简单调用即可实现了文章开头的轨迹带箭头以及沿轨迹线带方向的动态`marker`。

![20210208145619](https://blogimage.gisarmory.xyz/20210208145619.png)



注意：在动态播放的过程中缩放地图，标记点由于播放延迟，有时仍然会出现偏离轨迹线的问题，目前该问题暂未解决，后续解决后更新。



## 总结

1. 使用用`L.polylineDecorator`插件可以实现轨迹带箭头效果。
2. `Leaflet.AnimatedMarker`插件可以更流畅的实现marker沿线播放。
3. `Leaflet.AnimatedMarker`插件没有考虑`marker`角度问题。
4. `Leaflet.AnimatedMarker`插件没有考虑轨迹线的动态绘制。
5. 参考[Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker)、[leaflet-moving-marker](https://github.com/mohsen1/leaflet-moving-marker)中核心代码，解决角度问题以及轨迹线动态绘制等问题。
6. 将代码重新封装成插件，方便调用。



## 在线示例

在线示例：[http://gisarmory.xyz/blog/index.html?demo=LeafletRouteAnimate](http://gisarmory.xyz/blog/index.html?demo=LeafletRouteAnimate)

代码地址：[http://gisarmory.xyz/blog/index.html?source=LeafletRouteAnimate](http://gisarmory.xyz/blog/index.html?source=LeafletRouteAnimate)



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletRouteAnimate](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)。



关注WX《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。

