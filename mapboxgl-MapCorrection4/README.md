# mapboxgl 纠偏百度地图

之前分享了[mapboxgl 互联网地图纠偏插件](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection3)，插件当时只支持高德地图，我们今天研究一下如何让它支持百度地图。

要支持百度地图，核心在于百度地图的经纬度和瓦片编号的互转算法。

有了这个算法，就能根据当前窗口显示的经纬度范围，算出应该请求哪些瓦片。

有了这个算法，就能进一步算出请求来的每一个瓦片应该具体放到地图的哪个位置。

而这个互转算法，在不同地图中是不一样的，这取决于不同地图的瓦片编码方式。

我们之前使用的高德地图瓦片，采用的是和谷歌地图相同的`xyz`编码方式，这种编码方式，瓦片的坐标原点在世界地图的左上角，西经180 º，北纬85 º左右，瓦片编号规则如下图所示

![img](file:///C:/Users/HERO/AppData/Local/Temp/enhtmlclip/Image.jpg)

这种编码方式，经纬度和瓦片编号互转的算法是公开的（[Slippy map tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)），我们之前就是用的这个。

百度地图采用的是自己的编码方式，瓦片坐标的原点在本初子午线和赤道的交汇处。

![img](file:///C:/Users/HERO/AppData/Local/Temp/enhtmlclip/Image(1).jpg)



网上有人研究了国内常用地图的经纬度坐标与瓦片编号的互转算法（[链接](https://cntchen.github.io/2016/05/09/%E5%9B%BD%E5%86%85%E4%B8%BB%E8%A6%81%E5%9C%B0%E5%9B%BE%E7%93%A6%E7%89%87%E5%9D%90%E6%A0%87%E7%B3%BB%E5%AE%9A%E4%B9%89%E5%8F%8A%E8%AE%A1%E7%AE%97%E5%8E%9F%E7%90%86/)），包括高德、百度、谷歌、腾讯和必应地图，并在github上分享了[源码](https://github.com/CntChen/tile-lnglat-transform)。

我们把百度的那部分拿来，加入到我们的纠偏插件中，这样纠偏插件就能支持百度地图了。

（图）



这次升级，顺带把平时常用的天地图、OSM和GEOQ也加了进来。

天地图是大地2000坐标系，可以在84坐标地图上直接使用，误差很小。OSM地图直接是84坐标，不需要纠偏。所以它两个直接使用 mapboxgl 的原生接口，

GeoQ地图瓦片的编码方式和高德相同，改个瓦片请求地址就可以。

把它们都收集一起，爽歪歪。看效果

（图）

最后，mapboxgl还是推荐使用矢量瓦片，展示效果会好很多，上面的栅格瓦片可以作为补充使用。







