# Leaflet通过LayerGroup控制大量、多种图层显示隐藏
在使用leaflet进行点、线、面等图层管理时，经常会遇到对图层显示隐藏控制的需求，对于单个图层好说，只需要对图层样式重新编辑即可。但是当遇到需要对大量、多种图层同时控制时，再逐个图层编辑样式就有些繁琐了，这时候就用到了L.LayerGroup()。如何通过LayerGroup来控制多个图层的显示隐藏呢，通常有如下两种思路：

第一种，隐藏时清除图层，显示时重新添加图层，当数据量较小而且不需要频繁切换图层显示隐藏时，使用这种方式较为方便；但是，当数据量较大或者需要频繁切换图层显示隐藏时，使用这种方式则会增加对浏览器的压力，出现卡顿现象。

接下来我们重点说说第二种思路，通过‘layergroup.eachLayer()’方法循环遍历控制图层显示隐藏，此方式通过修改图层样式直接控制图层显示隐藏，在数据量较大或者需要频繁切换显示隐藏时，都比较流畅，效果如下：



![](http://blogimage.gisarmory.xyz/202010100301.gif)



核心代码如下：



![202010100301](http://blogimage.gisarmory.xyz/202010100301.png)

从上面代码中我们可以看出，由于maker图层 和 vector图层样式控制方式不同，需放在两个图层组，这样写起来感觉还是有些繁琐，而且也没有考虑图层初始化时样式。

通过对leaflet源码研究，了解到leaflet可以使用 include 方式对方法进行重写来做到修改源码。

> include方式
>
> 通过例子了解一下：比如leaflet源码中 Polygon.toGeoJSON() 方法不是在 Polygon.js 文件中写的，而是用 include 方式写在了GeoJSON.js文件中。Polygon类本来是没有toGeoJSON()方法的，这样就增加了这个方法。如果Polygon类中已经有了toGeoJSON()方法，这样写会根据执行的顺序，后执行的会把先加载的重写。
>
> ![](http://blogimage.gisarmory.xyz/20200923122649.png)



接下来，就采用include方式对LayerGroup添加显示隐藏方法，代码如下：

![202010150301](F:\myself\gisarmory\Leaflet.ShowHideLayerGroup\202010150301.png)

在这里，我们不止控制了图层的显示隐藏，还记录了图层默认状态下的透明度，以保证切换到显示时样式一致。

为方便使用，我们将上述代码封装成leaflet.ShowHideLayerGroup.js插件，你只需引用这个插件，调用“layergroup.showLayer()”、“layergroup.hideLayer()”就能实现对layergroup中所有图层的显示隐藏控制，是不是感觉用着很方便，代码很清爽。



![202010100302](http://blogimage.gisarmory.xyz/202010100302.png)

## 总结

1. 控制大量、多种图层的显示隐藏，首先添加到“L.LayerGroup()”，采用“layergroup.eachLayer()”方法循环遍历图层、修改样式来实现。
2. 把显示隐藏方法通过include方式封装成插件，一次引用，无限使用，方便简洁。

## 在线示例

[在线示例](http://gisarmory.xyz/blog/index.html?demo=LeafletShowHideLayerGroup)

[ShowHideLayerGroup插件](http://gisarmory.xyz/blog/index.html?source=LeafletShowHideLayerGroup)

不熟悉github的童鞋，可以微信搜索《GIS兵器库》或扫描下面的二维码，回复 “layergroup” 获得ShowHideLayerGroup插件的下载链接。

![](http://blogimage.gisarmory.xyz/20200923063756.png)




* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup](http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号或扫描上文的二维码， 第一时间获得更多高质量GIS文章。

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。