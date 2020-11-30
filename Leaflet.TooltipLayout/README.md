# leaflet可自动避让的气泡窗口



话不多说，先上效果：

![2020113002](F:\myself\gisarmory\Leaflet.TooltipLayout\2020113002.gif)



在平时项目工作中，经常遇到这种需求，两个点位完全重合了，但是就是想点击时同时看到这两个点位的信息。之前常用的解决方案就是处理下气泡代码，可以切换展示，甚至看到有些处理方式是直接把其中一个点位做偏移，从而可以看到两个点位来避免此问题。

![2020113005](F:\myself\gisarmory\Leaflet.TooltipLayout\2020113005.gif)

相信很多同学都用过这两种方式来解决问题，在此我们不评论上述两种方式是否可取。不过当我在GIT上找到`leaflet-tooltip-layout`插件这个插件后，我觉着这才应该是解决点位重合又要同时看到气泡信息的最佳解决效果。

在研究此插件过程中，发现该插件主要是通过对tooltip展示进行处理，同时展示多点位气泡信息。

![202011300101](F:\myself\gisarmory\Leaflet.TooltipLayout\202011300101.png)

在我们平时常遇到的另一种需求就是通过点击事件展示气泡信息，然而该插件没有清除的方法，无法直接实现点击查看气泡。经过对代码的研究，添加了清除的方法后，可在点击时使用该插件。

![202011300103](F:\myself\gisarmory\Leaflet.TooltipLayout\202011300103.png)

## 如何使用

引用插件后，只需简单的三步集合使用该插件，

第一步，将点位添加tooltip；

第二步，L.tooltipLayout.resetMarker(marker)；

第三步，L.tooltipLayout.initialize(map, onPolylineCreated)；

![202011300104](F:\myself\gisarmory\Leaflet.TooltipLayout\202011300104.png)

## 总结

1. 在地图上添加气泡窗口时，常遇到点位坐标重合，而气泡窗口无法避让展示的问题。
2. `leaflet-tooltip-layout`插件实现了通过处理`L.tooltip()`位置关系，达到气泡避让效果。
3. 直接引入`leaflet-tooltip-layout`插件调用时，未能正常展示。
4. 修复`leaflet-tooltip-layout`插件中bug，并重新封装，正常调用即可实现气泡自动避让效果。
5. 对常用情景编写示例，参考示例，方便使用。



## 在线示例

[点击显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletShowHideLayerGroup)

[常显示气泡](http://gisarmory.xyz/blog/index.html?demo=LeafletShowHideLayerGroup)




* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletTooltipLayout](http://gisarmory.xyz/blog/index.html?blog=LeafletTooltipLayout)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。