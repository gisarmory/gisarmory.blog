# leaflet可自动避让的气泡窗口



话不多说，先上效果：

![2020113002](https://blogimage.gisarmory.xyz/2020113002.gif)



在平时项目工作中，经常遇到这种需求，两个或者多个点位完全重合了，但就是想点击时同时看到这些个点位的信息。之前常用的解决方案就是处理下气泡代码，可以切换展示（如下图效果）；甚至看到有些处理方式是直接修改部分点位坐标，让点位不再重合，从而可以点击到每个点位来避免此问题。

![2020113005](https://blogimage.gisarmory.xyz/2020113005.gif)

相信有不少同学都用过这两种方式来解决此问题，在此我们不评论上述两种方式是否可取。不过当我在GIT上找到`leaflet-tooltip-layout`这个插件后，我觉着这才应该是解决点位重合又要同时看到所有点位气泡信息的最佳解决效果。

在使用该插件时，发现直接引用，并没有成功展示气泡信息。通过对该插件代码的研究，将`initialize()`方法中的`markerList = []`注释，即可正常使用。

![202011300106](https://blogimage.gisarmory.xyz/202011300106.png)

该插件主要是通过处理`L.tooltip()`位置关系，从而实现多点位气泡信息展示，同时尽可能避免气泡之间的遮盖，下图就是同时展示多个点位气泡信息的效果。

![202011300101](https://blogimage.gisarmory.xyz/202011300101.png)

在我们平时常遇到的另一种需求就是通过点位的点击事件来展示气泡信息。然而在使用该插件过程中，发现该插件没有清除的方法，无法直接实现点击查看气泡。经过对该插件代码研究，添加了清除的方法后，即可在点击时使用该插件，效果见文章开头gif图。

![202011300103](https://blogimage.gisarmory.xyz/202011300103.png)

## 如何使用

引用插件后，只需简单的三步即可使用该插件：

第一步，将点位添加tooltip；

第二步，L.tooltipLayout.resetMarker(marker)；

第三步，L.tooltipLayout.initialize(map, onPolylineCreated)；

![202011300104](https://blogimage.gisarmory.xyz/202011300104.png)

## 总结

1. 在地图上添加气泡窗口时，常遇到点位坐标重合，而气泡窗口无法避让展示的问题。
2. `leaflet-tooltip-layout`插件实现了通过处理`L.tooltip()`位置关系，达到气泡避让效果。
3. 直接引入`leaflet-tooltip-layout`插件调用时，未能正常展示。
4. 修复`leaflet-tooltip-layout`插件中bug，并重新封装，正常调用即可实现气泡自动避让效果。
5. 重新封装后的插件支持**同时展示多个点位气泡信息**以及通过**对重合点位的点击来展示气泡信息**。



## 在线示例

[点击显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletTooltipLayout1)

[常显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletTooltipLayout2)



[完整代码](http://gisarmory.xyz/blog/index.html?source=LeafletTooltipLayout)




* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletTooltipLayout](http://gisarmory.xyz/blog/index.html?blog=LeafletTooltipLayout)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。