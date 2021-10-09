# mapboxgl 纠偏百度地图



## 缘起

之前分享了[mapboxgl 互联网地图纠偏插件](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection3)，插件当时只集成了高德地图。

文章发布后，有小伙伴在后台留言，希望插件也能支持百度地图。

刚好国庆假期有时间就研究了一下。



## 插件加载瓦片原理

首先，插件之所以能够正确的加载互联网地图瓦片，关键是依托经纬度和瓦片编号的互转算法。

有了经纬度和瓦片编号的算法，插件就能根据当前窗口4个角的地图坐标，算出应该请求哪些瓦片。

再根据瓦片编号转经纬度的算法，算出请求到的每一个瓦片在地图上摆放的经纬度位置。

这样地图就能挣钱显示地图瓦片了。

然后监听地图范围的改变，当范围改变时，重复上述步骤更新地图瓦片。



## 瓦片编码方式

这个互转算法，在不同地图中是不一样的，这取决于地图的瓦片编码方式。

编码方式总结下来，可以分为4大类：谷歌XYZ、TMS、QuadTree、百度XYZ。

我们之前使用的高德地图瓦片，采用的是`谷歌xyz`编码方式，这种编码方式，瓦片的坐标原点在世界地图的左上角，西经180 º，北纬85 º左右，瓦片编号规则如下图所示

![img](http://blogimage.gisarmory.xyz/20211009174121.jpg)

这种编码方式，经纬度和瓦片编号互转的算法是公开的（[Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)），插件之前就是用的这个。

百度地图采用的是自己的`百度XYZ`方式，瓦片坐标的原点在本初子午线和赤道的交汇处，瓦片编号规则如下图所示：

![img](http://blogimage.gisarmory.xyz/20211009174118.jpg)



网上有人研究了这4类瓦片编码方式的，经纬度坐标与瓦片编号的互转[算法](https://cntchen.github.io/2016/05/09/%E5%9B%BD%E5%86%85%E4%B8%BB%E8%A6%81%E5%9C%B0%E5%9B%BE%E7%93%A6%E7%89%87%E5%9D%90%E6%A0%87%E7%B3%BB%E5%AE%9A%E4%B9%89%E5%8F%8A%E8%AE%A1%E7%AE%97%E5%8E%9F%E7%90%86/)，并在github上分享了[源码](https://github.com/CntChen/tile-lnglat-transform)。

我们把百度的那部分算法拿来，加入到我们的纠偏插件中，这样纠偏插件就能支持百度地图了。

![image-20211009124929783](http://blogimage.gisarmory.xyz/20211009174115.png)



## 插件升级

插件这次升级，除了新增百度地图以外，顺带把平时常用的天地图、OSM和GEOQ也加了进来。

天地图是大地2000坐标系，可以在wgs84坐标地图上直接使用，误差很小。OSM地图直接是wgs84坐标，不需要纠偏。

所以它两个在插件中直接使用 mapboxgl 的原生接口，其它地图则使用我们写的自定义图层。

GeoQ地图瓦片的编码方式和高德相同，改个瓦片请求地址就可以。

把它们都收集一起，看效果，真是爽歪歪

![动画3.1](http://blogimage.gisarmory.xyz/20211009174107.gif)



最后，在 mapboxgl 中还是推荐使用矢量瓦片，展示效果会好很多，上面的栅格瓦片推荐作为补充使用。

本地发布OSM地图矢量瓦片的方式可以参考之前写的文章 [OSM地图本地发布-环境搭建](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)、[OSM地图本地发布-如何生成各省市矢量地图](http://gisarmory.xyz/blog/index.html?blog=OSMOpenmaptiles)



## 插件地址

插件在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection4](http://gisarmory.xyz/blog/index.html?demo=mapboxglMapCorrection4)

插件代码地址：[http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection3](http://gisarmory.xyz/blog/index.html?source=mapboxglMapCorrection3)



## 总结

1. 之前分享的mapboxgl互联网地图纠偏插件只集成了高德地图，有小伙伴留言希望支持百度地图。
2. 插件加载互联网地图瓦片的原理是基于经纬度和瓦片编号的互转算法。
3. 因为不同地图使用的瓦片编码规则不同，所以不同地图的经纬度和瓦片编号的互转算法也会不同。
4. 网上有人分享了不同地图中，经纬度和瓦片编号的互转算法，我们把百度地图的互转算法拿来使用，这样插件就能支持百度地图瓦片的纠偏了。
5. 本次插件升级除了增加百度地图还增加了天地图、OSM地图、和geoQ地图。



## 参考资料

瓦片地图原理：

> https://segmentfault.com/a/1190000011276788

国内主要地图瓦片坐标系定义及计算原理：

> https://cntchen.github.io/2016/05/09/%E5%9B%BD%E5%86%85%E4%B8%BB%E8%A6%81%E5%9C%B0%E5%9B%BE%E7%93%A6%E7%89%87%E5%9D%90%E6%A0%87%E7%B3%BB%E5%AE%9A%E4%B9%89%E5%8F%8A%E8%AE%A1%E7%AE%97%E5%8E%9F%E7%90%86/

Slippy map tilenames：

> https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection4](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection4)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 只给你网上搜不到的GIS知识技能。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





