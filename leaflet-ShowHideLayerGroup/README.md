# Leaflet LayerGroup图层组控制显示隐藏
使用leaflet添加点、线、面等图层时，添加到L.layerGroup()中，可方便同层统一管理，在控制图层显示隐藏时，有两种思路：

第一种，隐藏时清除图层，显示时重新添加图层，但这种方式会增加对浏览器的压力，且当数据量较大时会有卡顿现象，不可取。

第二种，通过‘layergroup.eachLayer()’方法循环遍历控制图层显示隐藏，此方式通过修改图层样式直接控制图层显示隐藏，效果较好（由于maker图层 和 vector图层样式控制方式不同，需放在两个图层组来控制）。

效果如下：



![](http://blogimage.gisarmory.xyz/202010100301.gif)



核心代码如下：



![202010100301](http://blogimage.gisarmory.xyz/202010100301.png)



为方便使用，我们把上面的代码封装成[leaflet.ShowHideLayerGroup.js](http://gisarmory.xyz/blog/index.html?source=LeafletShowHideLayerGroup)插件，大家引用这个插件，调用“showLayer()”、“hideLayer()”就能实现对layergroup显示隐藏控制。



![202010100302](http://blogimage.gisarmory.xyz/202010100302.png)


## 在线示例

[在线示例](http://gisarmory.xyz/blog/index.html?demo=LeafletShowHideLayerGroup)

[ShowHideLayerGroup插件](http://gisarmory.xyz/blog/index.html?source=LeafletShowHideLayerGroup)

不熟悉github的童鞋，可以微信搜索《GIS兵器库》或扫描下面的二维码，回复 “layergroup” 获得ShowHideLayerGroup插件的下载链接。

![](http://blogimage.gisarmory.xyz/20200923063756.png)




* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup](http://gisarmory.xyz/blog/index.html?blog=LeafletShowHideLayerGroup)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号或扫描上文的二维码， 第一时间获得更多高质量GIS文章。

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。