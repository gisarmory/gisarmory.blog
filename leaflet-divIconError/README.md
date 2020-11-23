# H5时代leaflet中还在用DivIcon？

前段时间写了篇《[leaflet如何加载10万数据](http://gisarmory.xyz/blog/index.html?blog=leaflet100ThousandData)》的文章，有同学反应其中的Canvas-Markers插件不支持DivIcon。我们今天就来聊一聊，为什么这个插件不支持DivIcon，以及如何用H5的Canvas特性，做出以前用DivIcon才能实现的 **标签** 和 **文字标注** 功能。

老规矩，先上效果图：

标签功能

![canvas](http://blogimage.gisarmory.xyz/20201123185156.gif)

文字标注功能

![](http://blogimage.gisarmory.xyz/20201124073425.gif)



## 为什么不支持DivIcon

Canvas-Markers插件的创作目的是为了解决，大批量数据展示的性能问题，它通过使用H5中Canvas的绘图方式绘制Marker，提升了展示性能。但该插件目前只支持Icon，不支持DivIcon。

之所以不支持，是因为DivIcon的实现原理是在HTML页面中添加DOM元素，并在地图平移、缩放时不断的修改DOM元素的属性，而大量添加和修改DOM元素会拉低浏览器的显示性能，出现卡顿等现象。

如果使用Canvas-Markers后还在继续使用DivIcon，就相当于网络升级了千兆带宽以后，还在用之前的百兆路由器。这时的DivIcon就会和那个百兆路由器一样，成为整个通道中最为狭窄的地方，变成瓶颈。

如果不用DivIcon这个老路由器，有没有新路由器呢？

有！但要分情况。

平时工作中，用DivIcon通常是为了实现 **标签功能** 和 **文字标注** 功能

标签功能：

![image-20201121164957140](http://blogimage.gisarmory.xyz/20201123122419.png)

文字标注功能：

![image-20201121165508761](http://blogimage.gisarmory.xyz/20201123122423.png)



针对这两种情况，leaflet都有Canvas方式的解决方案。



## 标签功能

上文提到，Canvas-Markers插件目前只支持Icon类型的图标，翻看它的代码会发现，其实，它用Icon也只是把Icon当成一个Object来用， 只用来传参，并没有去用Icon内部的功能。因为Icon的内部，也是创建了一个img类型的DOM元素，它和DivIcon一样，大量添加会影响浏览器的显示性能。

Canvas-Markers插件通过Icon获取图片的地址和图片的偏移位置等参数，然后用Canvas的方式绘制图片。

标签由两部分组成，背景框和文字，背景框通常是一个图片。Canvas-Markers插件已经可以加载图片，我们只要让它再支持文字，并能控制文字的样式和位置，就可以实现标签功能了。

打开Canvas-Markers插件的代码，在下图位置增加一个绘制文字的方法。

![image-20201121172659282](http://blogimage.gisarmory.xyz/20201123122427.png)

再在下图中的三个位置，增加上面新增方法的调用

![image-20201121173254912](http://blogimage.gisarmory.xyz/20201123122430.png)

这样就可以实现标签功能了，看效果

![canvasicon2](http://blogimage.gisarmory.xyz/20201123122434.gif)

性能方面，最大支持10万条数据左右。



## 文字标注功能

我在github上搜索leaflet+text关键字，翻看了结果中的前20个代码库，找到了 LabelTextCollision 这个插件。

LabelTextCollision插件创作的目的，是为了实现的文字标注的自动避让功能，实现方式是Canvas，文字标注功能是它顺带解决的问题。

![image-20201121182405099](http://blogimage.gisarmory.xyz/20201123122439.png)

测试时，发现了它一个问题，1万条数据，在缩小地图时，显示很流畅，但放大地图时，会出现卡顿的现象，而且地图越放大，卡顿的就越厉害。

通常在加载大数据量时，都是越缩小地图越卡顿，越放大地图越流畅。但这个插件刚好相反，这是为啥呢？

个人推测，出现这种问题，多半是因为没有根据屏幕显示范围对数据做筛选造成的，不做筛选就会把屏幕显示范围外的数据也加上。

这个插件因为它做了文字显示的避让，越缩小地图，数据在屏幕上显示的就越集中，自动避让掉的文字就越多，显示的文字就越少，展示就越流畅。

越放大地图，数据在屏幕上显示的就越分散，自动避让的文字就越少，显示的文字就越多，这时如果没有做筛选，展示就会越来越卡顿。

看了下它的代码，证实了我的推测，确实没有发现，对屏幕区域外显示内容进行限制的代码。

那我们就来给它加上，在下图中的两个地方添加对屏幕显示范围的判断，只显示当前能看到的数据。

![image-20201121193759514](http://blogimage.gisarmory.xyz/20201123122442.png)

再试一下，哈哈，搞定

![](http://blogimage.gisarmory.xyz/20201124073437.gif)

测试了下，优化后，可以加载5万条数据左右。



## 更多场景

上面列举了DivIcon常见的两种使用场景，以及如何使用Canvas方式提高展示性能的解决方案，如果你那还有DivIcon的其它使用场景，可以在下方留言，我们一起讨论解决方法。



## 总结

1. Canvas-Markers插件的目的是为了解决，大批量数据展示时的性能问题。
2. DivIcon实现的原理是在HTML页面中添加DOM元素，大量添加和修改DOM元素会拉低浏览器展示性能。
3. 从提高展示性能的出发点考虑，Canvas-Markers插件不应该去支持DivIcon。
4. 用DivIcon，通常是为了实现标签功能和文字标注功能，这两个功能都有Canvas方式的解决方案。
5. 对Canvas-Markers插件进行优化，增加文字接口，可以替代DivIcon实现标签功能。
6. LabelTextCollision插件可以实现文字标注的自动避让功能，它是用Canvas方式实现，可以替代DivIcon实现文字标注功能。
7. LabelTextCollision插件在地图放大时，最多只能展示1万条数据左右，优化后可以达到5万条数据左右。



## 在线示例

标签功能 [http://gisarmory.xyz/blog/index.html?demo=diviconError-CanvasMarker](http://gisarmory.xyz/blog/index.html?demo=diviconError-CanvasMarker)

文字标注功能 [http://gisarmory.xyz/blog/index.html?demo=diviconError-LabelTextCollision](http://gisarmory.xyz/blog/index.html?demo=diviconError-LabelTextCollision)



## 源码

标签功能 [http://gisarmory.xyz/blog/index.html?source=diviconError-CanvasMarker](http://gisarmory.xyz/blog/index.html?source=diviconError-CanvasMarker)

文字标注功能 [http://gisarmory.xyz/blog/index.html?source=diviconError-LabelTextCollision](http://gisarmory.xyz/blog/index.html?source=diviconError-LabelTextCollision)



------

原文地址：[http://gisarmory.xyz/blog/index.html?blog=diviconError](http://gisarmory.xyz/blog/index.html?blog=diviconError)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。

