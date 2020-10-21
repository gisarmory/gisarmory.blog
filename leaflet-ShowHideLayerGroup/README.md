# leaflet中如何通过透明度控制layerGroup的显示隐藏


最近翻看leaflet的API文档，发现leaflet中没有直接控制LayerGroup显示隐藏的方法，那如何来实现LayerGroup的显示和隐藏呢？

通常有如下两种思路：

第一种，隐藏时清除图层，显示时重新添加图层，当数据量较小，并且不需要频繁切换图层显示隐藏时，使用这种方式较为方便。但是，当数据量较大，或需要频繁切换图层显示隐藏时，使用这种方式则会增加对浏览器的压力，出现卡顿现象。

第二种，遍历图层内部所有要素，通过控制要素透明度的方式，达到控制图层显示隐藏的目的。此方式可以解决在数据量较大，或需要频繁切换图层显示隐藏时，出现卡顿的情况，效果如下：



![2020102101](https://blogimage.gisarmory.xyz/2020102101.gif)



核心代码如下：



![202010100301](http://blogimage.gisarmory.xyz/202010100301.png)

从上面代码中我们可以看出，由于maker要素 和 vector要素样式控制方式不同，需放在两个图层组，这样写起来感觉还是有些繁琐，而且也没有考虑图层初始化时样式。

通过对leaflet源码研究，了解到leaflet可以使用 include 方式对方法进行重写来做到修改源码。

> include方式
>
> 通过例子了解一下：比如leaflet源码中 Polygon.toGeoJSON() 方法不是在 Polygon.js 文件中写的，而是用 include 方式写在了GeoJSON.js文件中。Polygon类本来是没有toGeoJSON()方法的，这样就增加了这个方法。如果Polygon类中已经有了toGeoJSON()方法，这样写会根据执行的顺序，后执行的会把先加载的重写。
>
> ![](http://blogimage.gisarmory.xyz/20200923122649.png)



接下来，就采用include方式对LayerGroup添加显示隐藏方法，代码如下：

![202010150301](https://blogimage.gisarmory.xyz/202010150301.png)

在这里，我们不止控制了图层的显示隐藏，还记录了图层默认状态下的透明度，以保证切换到显示时样式一致。

为方便使用，我们将上述代码封装成插件，你只需引用这个插件，调用`layergroup.showLayer()`、`layergroup.hideLayer()`就能实现对 layerGroup 中所有要素的显示隐藏控制。

看使用插件后的代码是不是很清爽

![202010100302](http://blogimage.gisarmory.xyz/202010100302.png)

## 总结

1. 控制layerGroup显示隐藏的方式有两种：添加、移除的方式；和遍历内部要素，控制每个要素透明度的方式。
2. 控制透明度方式效率更高，体验更好，但leaflet中没有现成方法，需要自己写代码实现。
3. 实现时需要注意，`maker`要素 和 `vector`要素样式控制方式不同。
4. 把控制透明度方式封装成插件，通过`showLayer()`、`hideLayer()`方法直接使用。



## 在线示例

[在线示例](http://gisarmory.xyz/blog/index.html?demo=LeafletShowHideLayerGroup)

[ShowHideLayerGroup.js 插件](http://gisarmory.xyz/blog/index.html?source=LeafletShowHideLayerGroup)






* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup](http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。