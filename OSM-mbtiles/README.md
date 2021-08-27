# 发布 mbtiles 存储的矢量瓦片

之前我们分享过如何[在本地发布OSM矢量瓦片地图](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)，里面有介绍生成的矢量瓦片地图存放在 `.mbtiles` 文件中，然后用 tileserver-gl 软件发布。

> mbtiles 是基于sqllite数据库存储地图瓦片数据的标准规范，一个`.mbtiles`文件就是一个sqllite数据库。

最近遇到个问题，项目上需要将这份`.mbtiles`矢量瓦片部署到客户服务器上并发布。

之前也分享过[我的开源GIS解决方案](http://gisarmory.xyz/blog/index.html?blog=GISerSolution)，里面将 jdk、postgres、geoserver、tomcat 都搞成了绿色版，并且可以通过批处理脚本实现一键将它们都注册成系统服务，这样就形成了一个绿色版的安装包，部署时会很方便。

架构整体是偏 java 体系的，而这次发布矢量瓦片用到的 tileserver-gl 是基于 nodejs 开发的，按上面的思路，需要将 nodejs 也搞成绿色版的，并使用批处理注册服务。

因为不想把安装包搞的太大，也不想用太多的技术体系，让后期维护变得太复杂，所以就想能不能在现有的技术体系下搞定 .mbtiles 发布的问题。

按这个思路，需要去研究有没有相关的geoserver插件，或是 java 的软件或项目。

## geoserver插件

先研究了geoserver插件，还真有。

geoserver有个mbtiles的扩展插件（链接），支持对mbtiles的读写。

从官网下载插件，安装尝试后发现跟想的有点不一样。

首先要肯定的是，用是能用，结果完全没有问题，就是过程有点曲折。

 .mbtiles 文件中存的是处理好的pbf文件，按说插件只需要根据请求参数，返回对应的pbf文件就ok了。

但geoserver的做法是，将mbtiles 中的 pbf 文件作为矢量数据源来使用（类似于读取shp文件中的数据）。

具体为：

1. 先将pbf瓦片拼起来，读取拼接后的各图层原始数据
2. 把图层原始数据发布成 geoserver 的矢量瓦片服务
3. 前台调用矢量瓦片服务时，geoserver 把数据处理成 pbf 文件返回给前台

怎么说呢，这么做和把pbf文件直接扔给前台相比，结果是一样的，但就是感觉 geoserver 的戏太足，内耗太严重，还有就是发服务的过程也很麻烦。

只能说，这个插件设计的初衷就是用来读取原始数据的，不是为发布数据而生的。

## java项目

再来看看 java 这边。

在github上搜了一下，还真有，mbtiles4j（项目名称、链接），

是个现成的java工程，拉取下来研究了一下，逻辑很简单，就是读取mbtiles 中的瓦片返回给前台，这一点很符合要求，美中不足的是，这个项目是针对栅格瓦片的，默认只支持 .png 请求，不支持 .pbf 。

这个好说，有源码，改改就是了。

改完后发现，前端地图不显示，瓦片请求地址报 404 ，

看了一下mbtiles 库中的瓦片编号，确实没有，

为啥呢？

哈哈，这个我有经验，持续关注我们的同学还记不记的，我之前分享过[如何让maputinik支持geoserver](http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles2)的问题，里面最关键的一点就是设置mapboxgl请求瓦片的模式，模式包括 xyz 和 tms，mapboxgl模式是用 xyz 的。

难道openmaptile生成的这个mbtiles 文件是按tms存储的？试一下就知道了

果然 ~ 没那么简单，地图还是没有出来，但瓦片可以请求到了

看来确实是tms的，但为啥地图还是没有出来呢？

对比了下 tileserver-gl 和 mbtiles4j 的返回参数，发现了问题所在。

（对比图）

pbf 文件是采用 gzip 压缩过的，需要在返回参数中明确告知返回内容的类型是 gzip。

那就加上，最终，搞定。

（图）

这个通了，剩下的就简单了，工程编译成war包，直接扔到tomcat下就可以了。

## 大比例地图显示

流量地图时发现另一个问题，我只把地图切到了14级，因为矢量瓦片中，14级就包含的内容就已经很细了，并且也不大，所以没有必要再往下切。但用地图浏览时，超过14级后，地图就不显示了。

测试了 tileserver-gl 就没有这个问题，看来是后台需要把超过14级的请求参数出来一下，超过14级时，返回14级的瓦片翻了翻 tileserver-gl 的代码，没有找到相关逻辑的代码。

在同事的提醒下，发现前台请求时，15级和更高的版本直接就是按14级来请求的，这说明这个逻辑是在前台处理的。

去扒tileserver-gl 样例的地图样式配置，最终，发现对数据源设置maxzoom可以解决这个问题。

看一下官网的解释，大概意思是，如果你设置maxzoom=14，当地图缩放超过14级时，地图仍然会使用14级的瓦片
![img](file:///C:/Users/HERO/AppData/Local/Temp/enhtmlclip/Image.png)

## 总结：

1. 本地发布的OSM矢量瓦片地图，生成的矢量瓦片存放在 mbtiles 文件中

2. 发布mbtiles 中的矢量瓦片，主流的方式是 tileserver-gl ，它基于nodejs开发的

3. 自己想搞一套基于java体系的工具，这样比较符合现在的架构

4. geoserver是将pbf作为矢量数据源来使用，一是逻辑不合理，二是这样操作比较麻烦

5. 从github上找到了mbtiles4j项目，通过通过修改后，使它支持发布pbf

6. mapbox使用时，需要设置数据源的maxzoom


## 源码

