# 发布 mbtiles 存储的矢量瓦片

之前我们分享过如何 [在本地发布OSM矢量瓦片地图](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)，里面介绍了生成的矢量瓦片会存放在 `.mbtiles` 文件中，然后用 tileserver-gl 软件发布。

> [mbtiles](https://github.com/mapbox/mbtiles-spec) 是基于sqllite数据库存储地图瓦片数据的标准规范，`.mbtiles`文件就是实现了这个规范的sqllite数据库。

最近遇到个相关的问题，项目上需要将这份`.mbtiles`格式的矢量瓦片部署到客户服务器上并发布。

之前分享过我在用的 [开源GIS解决方案](http://gisarmory.xyz/blog/index.html?blog=GISerSolution)，里面将 postgis、geoserver、tomcat 都搞成了绿色版，并且可以通过批处理脚本将它们一键注册成系统服务，这样就形成了一个套开源GIS的绿色版安装包，部署时会很方便。

这套安装包的整体技术架构是偏 java 的，而这次发布矢量瓦片用到的 tileserver-gl 是基于 nodejs 开发的，按上面的思路，需要将 nodejs 也搞成绿色版的，并且可以使用批处理注册成系统服务。

因为不想把安装包搞的太大，也不想用太多的技术体系，让后期维护变得复杂，所以就想能不能在现有的技术体系下搞定 .mbtiles 发布的问题。

按这个思路，需要去研究有没有相关的geoserver插件，或是 java 的软件或项目。

下面是我研究的具体过程，不想看过程的同学可以直接跳到末尾看总结。

## geoserver插件

先研究了geoserver插件，还真有。

geoserver有个mbtiles的扩展插件（[https://docs.geoserver.org/latest/en/user/community/mbtiles/index.html](https://docs.geoserver.org/latest/en/user/community/mbtiles/index.html)），支持对`.mbtiles`文件的读写。

> geoserver 安装 mbtiles 插件的教程可以参考这篇：[https://blog.csdn.net/dyxcome/article/details/98375453](https://blog.csdn.net/dyxcome/article/details/98375453)

从官网下载插件，安装测试后，发现跟想的有点不一样。

geoserver安装完插件后，新建数据源的界面多了两个 mbtiles 相关的选项，如下图，上面的是发布矢量瓦片，下面的是发布栅格瓦片。

![](http://blogimage.gisarmory.xyz/20210901185754.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

我用第二个红框，发布栅格瓦片的选项，发布了下矢量瓦片，会报错。

用第一个红框，发布矢量瓦片的选项，可以走的通，但就是过程有点曲折，需要把 pbf 中的图层再挨个发布一遍。

![](http://blogimage.gisarmory.xyz/20210901185749.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

 `.mbtiles` 文件中存的是处理好的 `pbf` 文件，按说插件只需要根据请求参数，从 sqllite 数据库中查询 `pbf` 文件，返回给前台就 ok 了。

但 geoserver 不是这么做的，它是将 `.mbtiles` 文件中的 `pbf` 瓦片作为矢量数据源来使用，类似于读取 `.mdb` 文件。

可以推理出，geoserver 内部的处理方式大概是：

1. 先将 `pbf` 瓦片拼起来，读取拼接后的各图层原始数据
2. 把图层原始数据发布成 geoserver 的矢量瓦片服务
3. 前台调用矢量瓦片服务时，geoserver 把数据处理成 `pbf` 文件返回给前台

怎么说呢，这么做和把 `pbf` 文件直接扔给前台相比，结果是一样的，但就是感觉 geoserver 的戏太足，内耗太严重，还有就是这个发服务的操作过程也很麻烦。

只能说，这个插件针对矢量瓦片的设计，仅是用来读取原始数据的，不适合用来发布数据。

## java项目

再看 java 这边。

在 github上搜了一下，找到了这个项目：mbtiles4j（[https://github.com/jtreml/mbtiles4j](https://github.com/jtreml/mbtiles4j)）。

是个现成的 java 工程，拉取下来研究了一下，逻辑很简单，就是直接读取 `mbtiles` 中的瓦片返回给前台，这一点很符合要求，美中不足的是，这个项目是针对栅格瓦片的，默认只支持 `.png` 文件，不支持 `.pbf` 。

这个好说，有源码，改改就是了。

改完后发现，前端地图不显示，瓦片请求地址报 404 ，

将请求地址中的瓦片编号和 `mbtiles` 库中的瓦片编号对了一下，确实没有。

为啥呢？

哈哈，这个我有经验，持续关注我们的同学还记不记的，我之前分享过关于 [如何让 maputinik 支持 geoserver ](http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles2)的问题，里面最关键的一点就是设置 mapboxgl 请求瓦片的模式 `scheme`，模式包括 `xyz` 和 `tms`，默认使用 `xyz` 。

难道 openmaptile 生成的这个 `mbtiles` 文件是按 `tms` 存储的？试一下就知道了

果然 ~ 没那么简单，地图还是没有出来，但瓦片可以请求到了，看来确实是 `tms` 的。

> 事后简单翻了一下 [mbtiles](https://github.com/mapbox/mbtiles-spec) 规范，里面有明确写到，数据源是以 [tms](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification) 格式来存储的。
>
> 看来还是要多研究标准规范和说明文档。

但为啥地图还是没有出来呢？

对比了下 tileserver-gl（下图左） 和 mbtiles4j（下图右） 的返回参数，发现了问题所在。

![](http://blogimage.gisarmory.xyz/20210831180609.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

pbf 文件是采用 gzip 压缩过的，需要在返回参数中明确告知返回内容的类型是 gzip，而刚才将 mbtiles4j 中的png 改成 pbf 后，没有加这个设置。

加上试试，哈哈，搞定。

![](http://blogimage.gisarmory.xyz/20210902070054.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

这个通了，剩下的就简单了，工程编译成 war 包，直接扔到tomcat下就可以了。

## 大比例时地图显示

本来以为可以收工了，但浏览地图时发现了另一个问题。

我的地图只切到了14级，因为在矢量瓦片中，14级包含的内容就已经很细了，所以没有必要再往下切。

但用地图浏览时，超过14级后，因为后台没有对应的瓦片，前台就请求不到数据，地图就不显示了。

用 tileserver-gl 发布同样的 mbtiles 文件，再用它的默认地图查看器浏览地图，就没有这个问题。

看来后台需要把超过14级的请求参数处理一下，超过14级时，直接返回14级的瓦片。

翻了翻 tileserver-gl 的代码，并没有找到相关的逻辑。

在同事的提醒下，发现 tileserver-gl 的默认地图查看器，它的前台请求在超过14级时，是按14级来请求的，这说明我要找的逻辑是在前台完成的。

去翻 tileserver-gl 的地图样式配置，和我自己的配置对比后发现，对数据源设置 `maxzoom` 就可以解决这个问题。

![](http://blogimage.gisarmory.xyz/20210831180559.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

看一下官网的解释，大概意思是，如果你设置maxzoom=14，那么当地图缩放超过14级时，地图仍然会使用14级的瓦片。
![](http://blogimage.gisarmory.xyz/20210831180556.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

这个设置正是我要的。

我把改完后的后台代码上传到了github，方便以后遇到同样问题的同学使用。

## 源码：

地址：[http://gisarmory.xyz/blog/index.html?source=OSMMbtiles](http://gisarmory.xyz/blog/index.html?source=OSMMbtiles)

## 总结：

1. 本地发布的OSM矢量瓦片地图，生成的矢量瓦片存放在 mbtiles 文件中

2. 发布mbtiles 中的矢量瓦片，目前主流的方式是 tileserver-gl ，它基于nodejs开发的

3. geoserver有个读取 mbtiles 的插件，但它针对矢量瓦片的设计是用来读取 pbf 中原始数据的，不适合用来发布数据。

5. github上有个 mbtiles4j 的项目，java 开发的，稍加修改后，可以用来直接发布 mbtiles

6. mapboxgl 使用发布的地图瓦片时，需要设置数据源的 maxzoom 属性。



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=OSMMbtiles](http://gisarmory.xyz/blog/index.html?blog=OSMMbtiles)。

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。



