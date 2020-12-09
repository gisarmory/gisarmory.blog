# leaflet如何优雅的展示重叠点位的气泡窗口



话不多说，先上效果：

效果一：

![2020120902](F:\myself\gisarmory\Leaflet.TooltipLayout\2020120902.gif)

效果二：

![2020120901](F:\myself\gisarmory\Leaflet.TooltipLayout\2020120901.gif)

在平时项目工作中，经常遇到这种需求，两个或者多个点位完全重合了，但就是想点击时同时看到这些个点位的信息。之前看到有些同学的处理方式是，直接修改部分点位坐标，让点位不再重合，从而可以点击到每个点位来避免此问题，在此我们暂不评论此方式是否可取。接下来我们从两个维度来解决此问题。

## 方案一 PopupListLayer：

此方案的处理方式是，点击时获取与该点位重合的所有点位，然后整合需要在气泡中展示的内容，添加切换功能，达到切换展示所有气泡信息的效果（见本文开头效果一）核心代码如下。

![2020120703](https://blogimage.gisarmory.xyz/2020120703.png)

我们将该方法封装成插件，引用插件后，只需简单的两步即可实现上图效果。

第一步：初始化`popupListLayer` 

`var popupListLayer = new L.popupListLayer().addTo(map)`。

第二步：将点位以及气泡内容传入`popupListLayer`

`popupListLayer.addMarker(marker, contentHTML)`

![202012040101](https://blogimage.gisarmory.xyz/202012040101.png)



## 方案二 PopupLayoutLayer：

此方案主要是借鉴在GIT上发现的`leaflet-tooltip-layout`这个插件。通过处理`L.tooltip()`位置关系，实现多气泡信息展示，同时尽可能避免气泡之间的遮盖。

该方案支持通过点击点位展示气泡（见本文开头效果二）以及同时展示所有点位气泡（如下图效果）。

![](https://blogimage.gisarmory.xyz/202011300101.png)

我们将该方法封装成插件，引用插件后，只需简单的两步即可实现上述效果。

第一步：初始化`popupLayoutLayer`。如需查看所有点位气泡，需将 `showAll` 参数设置为 `true`，默认为`false，点击查看气泡信息。

`var popupLayoutLayer = new L.popupLayoutLayer({`

​	`showAll: true // true，显示所有气泡；默认为 false，通过点击查看气泡`，

`}).addTo(map)`

第二步：将点位以及气泡内容传入popupLayoutLayer

`popupLayoutLayer.addMarker(marker, contentHTML)`

第三步：分为点击查看气泡和展示所有气泡两种情况

1、点击查看气泡。添加点击事件，在点击事件中添加气泡

`popupLayoutLayer.on('click', function(evt) {})`

2、展示所有气泡

`popupLayoutLayer.showPopup()`

![2020120903](F:\myself\gisarmory\Leaflet.TooltipLayout\2020120903.png)



## 总结

1. 在地图上添加气泡窗口时，常遇到点位坐标重合，而气泡窗口无法避让展示的问题。
2. 引用`PopupListLayer`插件，通过切换内容展示。
3. 引用`PopupLayoutLayer`插件，通过处理`L.tooltip()`位置关系，实现多气泡信息展示，同时尽可能避免气泡之间的遮盖。
5. `PopupLayoutLayer`插件支持**通过对重合点位的点击来展示气泡信息**以及**同时展示所有点位气泡信息**。



## 在线示例

[PopupListLayer 切换显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletOverlapMarkerPopup1)

[PopupLayoutLayer 显示所有气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletOverlapMarkerPopup2)

[PopupLayoutLayer 点击显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletOverlapMarkerPopup3)

[完整代码](http://gisarmory.xyz/blog/index.html?source=LeafletOverlapMarkerPopup)



## 参考内容

https://github.com/ZijingPeng/leaflet-tooltip-layout


* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletPopupLayoutLayer](http://gisarmory.xyz/blog/index.html?blog=LeafletTooltipLayout)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。