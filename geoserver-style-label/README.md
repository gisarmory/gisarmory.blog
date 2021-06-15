# geoserver发布的wms标签图层显示不全问题

最近遇到个问题，有客户反馈：在查看地图数据时，本来显示的点位名称，在地图放大时有些不显示了，是不是数据有问题？

排查问题后发现，数据是没问题的，可确实出现了客户描述的情况，如下图所示：



![](https://blogimage.gisarmory.xyz/geoserver1.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



通常`GIS`服务器会为了解决标签重叠显示的问题，默认使用标签自动避让功能，但~这样不应该是放大地图后显示的标签会越来越多吗，怎么还更少了呢？

地图是用`geoserver`发布的，熟悉`geoserver`的同学都知道，`geoserver`图层的显示主要是用图层样式来控制的，包括图层的显示层级、标签自动避让等。

于是从这个思路入手，经过一番查找。。。

发现在配置`geoserver styles`的时候，把`partials`参数设置为`true`,能够解决这个问题

![](https://blogimage.gisarmory.xyz/2021051801.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

这个参数是什么意思呢，下面是[官方文档](https://docs.geoserver.org/latest/en/user/styling/sld/reference/labeling.html)给出的解释

![](https://blogimage.gisarmory.xyz/2021051802.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

大概意思是，当标签在瓦片边缘显示不全时，是否绘制。

该属性默认为`false`不绘制，这样就会出现文章开头描述的问题，本来显示的标签，结果地图放大后却不显示了。

把`partials`参数设置为`true`后，标签可以显示了，但是又出现了新的问题，就是在瓦片边缘的标签显示不全，如下图：

![](https://blogimage.gisarmory.xyz/2021051806.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

又经过一番查找。。。

注意到，发布标签图层时，有个`Default Rendering Buffer`的参数，这个参数默认为空，试着将它设置为`100`后，再重新刷新图层，发现标签显示不全的问题竟然解决了。

![](https://blogimage.gisarmory.xyz/2021051103.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

![2021051104](https://blogimage.gisarmory.xyz/2021051104.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

该参数的[官方解释](https://docs.geoserver.org/latest/en/user/data/webadmin/layers.html)如下

![](https://blogimage.gisarmory.xyz/2021051803.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

我的理解是，默认情况下`WMS`的一个瓦片只处理自己范围内的数据，当设置缓冲后，瓦片就会向外多处理一部分，相邻的瓦片会有重叠，这样就能相互照应，避免缺失标签。

如下图所示，当`Default Rendering Buffer`设置为空时，图中框选部分是不显示的，原因是此标签对应的点位不在该瓦片所包含的范围内，当设置为合适的值后，该标签就会显示。

![](https://blogimage.gisarmory.xyz/2021051804.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



综上，`geoserver`发布的`wms`标签图层显示不全问题已完美解决。

![](https://blogimage.gisarmory.xyz/2021051105.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



> 这个项目是老项目维护，使用的栅格瓦片，新项目中已经开始使用矢量瓦片技术，矢量瓦片因为是在前台渲染，在标签显示上更灵活，效果更好，也推荐大家使用，具体使用可以参考如下思路：
>
> 1. 使用`geoserver`发布矢量瓦片，这个百度一下会有很多教程。
> 2. 使用`maputnik`配图获取配图样式。注意，在使`maputnik`对`geoserver`配图是会遇到问题，具体解决方式参考[如何不改源码让maputnik支持geoserver](https://blog.csdn.net/gisarmory/article/details/116401076)
> 3. 使用`mapboxgl`调用`geoserver`发布矢量瓦片图层，图层样式采用`maputnik`导出的配图样式。
>



## 总结

1. `geoserver`发布的`WMS`标签图层使用默认样式，在瓦片边缘的标签会不显示
2. 把样式中的`partials`参数设置为`true`，可显示瓦片边缘的标签，但是会显示不全
3. 在图层发布中，将`Default Rendering Buffer`参数设置为`100`，显示不全的标签会显示完整



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=GeoServerStyleLabel](http://gisarmory.xyz/blog/index.html?blog=GeoServerStyleLabel)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。