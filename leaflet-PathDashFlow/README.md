# Leaflet 动态流向线
使用Leaflet.Path.DashFlow扩展可实现轨迹动态展示、管道流向动态展示、河流流向动态展示等，增强可视化展示效果。
使用方式也很简单，只需引入插件在正常添加线、面的时候，加入“ dashSpeed”参数即可。

效果如下：

![202010100101](http://blogimage.gisarmory.xyz/202010100101.gif)

核心代码如下：

![202010100101](http://blogimage.gisarmory.xyz/202010100101.png)

注意，在“dashSpeed”为负时，线的方向是正向流动。

使用此插件的时候，当初始化地图“ preferCanvas”参数为“true”时，及使用“Canvas”方式绘制时，效果不可用，需要在“leaflet\layer\vector\Canvas.js”中“_updateDashArray”和“_fillStroke”两个方法中添加如下代码：

![202010100102](http://blogimage.gisarmory.xyz/202010100102.png)
![202010100103](http://blogimage.gisarmory.xyz/202010100103.png)

为方便使用，我们将“L.Path.DashFlow”插件重新封装，大家引用这个插件，即可在“Canvas”和“SVG”两种方式下使用此插件。

## 在线示例

[在线示例](
http://gisarmory.xyz/blog/index.html?demo=LeafletPathDashFlow)

[完整代码](
http://gisarmory.xyz/blog/index.html?source=LeafletPathDashFlow)

[官方示例](
https://ivansanchez.gitlab.io/Leaflet.Path.DashFlow/demo.html)

[LeafletPathDashFlow插件](http://gisarmory.xyz/blog/index.html?source=LeafletPathDashFlow)

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=LeafletPathDashFlow](http://gisarmory.xyz/blog/index.html?blog=LeafletPathDashFlow)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。


