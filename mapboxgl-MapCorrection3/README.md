# mapboxgl 互联网地图纠偏插件（三）

先说结论，结论当然是：大功告成，喜大普奔。看效果图：

![](http://blogimage.gisarmory.xyz/20210815195557.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



好了，接下来说一下过程

先回顾一下这个系列的[ 第一篇 ](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection1)和[ 第二篇 ](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection2)

第一篇是直接改的 mapboxgl 源码，在源码里面对瓦片的位置进行纠偏，遇到的问题是，地图旋转时会有错位，还有瓦片纠偏后屏幕边缘会有空白。

第二篇是写了一个 mapboxgl 自定义图层，遇到的问题是，地图在大比例尺时，瓦片会疯狂抖动。

这两篇文章发出后，有两位大牛针对上面的问题，给出了建设性的意见。

一个是思否上的网友“[undefined](https://segmentfault.com/a/1190000040196497)”（这个不是bug，是它的名称），他在看了第一篇文章后，找出了地图旋转时瓦片错位的原因，并给出了解决方法。

![](http://blogimage.gisarmory.xyz/20210815195638.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

按照上面的思路，我重新写了一个不包含旋转参数的 pixelMatrix 矩阵后，错位问题完美解决。

![](http://blogimage.gisarmory.xyz/20210815195703.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

解决了错位后还有一个问题，屏幕边缘出现空白的问题。

我的解决思路是，在计算瓦片的显示范围时，对显示范围进行偏移，让程序按偏移的范围去请求瓦片，这样后续瓦片纠偏后，就不会出现空白区域了。

在二维地图中，瓦片显示的范围是根据屏幕 4 个角的坐标来确定的。但 mapboxgl 是三维地图，三维地图的显示范围是根据相机的参数来计算的，需要判断相机视椎体和瓦片的相交关系，这里还没有整明白。

所以，这个方案就又卡这儿了。



另一个网友是 mapboxgl 技术交流群里的“可乐瓶里泡枸杞”，他针对第2篇文章中的大比例尺时地图抖动问题，给指条明路。

![](http://blogimage.gisarmory.xyz/20210815195710.jpg?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

上图的博客链接中详细说明了地图抖动的原因，大概意思是：webgl 只支持 float32 精度，而 JS 默认是采用 float64 精度，JS 中的高精度数字向webgl 传输时会造成精度损失，这种损失带来的影响就是地图抖动，比例尺越大抖动的越厉害。

如何能避免精度的丢失？博客中介绍了 deck.gl 的做法：

1. 将经纬度坐标转墨卡托坐标这一步，放到 webgl 中来实现，目的是为了使用 GPU 计算
2. 在比例尺大于12级时，不再直接使用墨卡托坐标，而是计算墨卡托坐标和屏幕中心点的相对位置。使用 float32 的精度保存相对位置是完全没有问题的，这样规避了精度丢失的问题。
3. 重写 view 和 Projection 矩阵。

按这个思路，将上次写的 mapboxgl 自定义图层纠偏插件进行了改造，最终大比例尺时地图不再抖动了。但又遇到个新问题，拖动地图时，瓦片和鼠标的移动距离不一致。

![](http://blogimage.gisarmory.xyz/20210815195718.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

返回去看那篇博客的在线示例，也有同样的问题

![](http://blogimage.gisarmory.xyz/20210815195725.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

既然这样，那就解决问题吧，瞅了瞅代码，总觉得下面这两行不顺眼，

![](http://blogimage.gisarmory.xyz/20210815195733.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

不除 2 了试试，哈哈，一招命中，问题解决。

![](http://blogimage.gisarmory.xyz/20210815195741.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



至此，mapboxgl 加载高德地图瓦片纠偏的问题成功解决，我把他封装成了插件，方便大家使用，GIS兵器库中又多了一件趁手的兵器。

这个插件目前不仅支持对高德地图瓦片纠偏，还支持对所有 gcj02 坐标的栅格瓦片进行纠偏。

当然，作为插件来讲，它还不够完美，目前发现有这么几个可以完善的地方：

1. 跟 mapboxgl 自带的瓦片图层相比，瓦片在缩放时有点发虚
2. 地图缩放时，瓦片没有过渡效果
3. 移除图层后，有时会莫名其妙的突然出现。

这些问题，后续会慢慢完善。也欢迎大家一起参与进来，多提 Issues 和 Pull requests



## 地址

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection3](http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection3)

插件地址：[http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection3](http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection3)



## 总结

1. 解决 mapboxgl 中高德地图瓦片偏移的问题有两个方案，方案一改源码，方案二写自定义图层
2. 方案一有了突破，解决了地图旋转时瓦片错位的问题，但偏移后屏幕边缘空白的问题没有解决
3. 方案二在成功解决了地图大比例尺上瓦片抖动的问题后，最终实现了瓦片的纠偏。
4. 将方案二的代码封装成了插件，方便大家使用

<br>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection3](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection3)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 只给你网上搜不到的GIS知识技能。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





