# leaflet中如何优雅的解决百度、高德地图的偏移问题

话不多说，先上效果图

![](http://blogimage.gisarmory.xyz/20200920110715.gif)



以前在做项目时，经常会听到客户说，你们这个地图是哪来的，太丑了，能不能换成百度地图……高德也行……

大家生活中，基本上都已经习惯了使用百度地图和高德地图，而在做项目时，用这两个地图做为底图，也基本成为了标配。但在开发中使用这两个地图，会遇到一个拦路虎，坐标偏移问题。

全球现在用的最多的坐标，是wgs84坐标，专业GPS设备和手机GPS定位得到的坐标，通常都是这个坐标。我们国家为了保密需要，要求在国内发布的互联网地图，必须要在这个基础上进行加密偏移。加密后的坐标叫做国测局坐标，俗称火星坐标。高德地图、腾讯地图、国内的谷歌地图都是这个坐标。百度地图则是在火星坐标的基础上再次加密，形成了百度坐标。

leaflet有一个加载互联网地图的插件[leaflet.ChineseTmsProviders](https://github.com/htoooth/Leaflet.ChineseTmsProviders)，可以轻松实现加载高德、百度、天地图、谷歌等在线地图瓦片，但并没有去解决它们的偏移问题。高德和百度地图倒是提供了wgs84坐标转成自己坐标的在线接口，但仅支持单向转入，不支持反向再转回来，这会导致地图拾取坐标等功能无法得到wgs84坐标。

网上流传着一份wgs84坐标、火星坐标和百度坐标之间相互转换的算法。在多个项目中使用后发现，基本很准，偶尔有误差，但很小，也就几米以内，平时用时基本感觉不到。



## 如何集成到leaflet

两种思路：

第一种，把纠偏算法封装成一个接口，类似上面提到的百度、高德地图的坐标转换接口，在向地图加载数据前，先调用这个接口完成坐标的转换再添加到地图上。等于是把自己的数据偏移到互联网地图坐标上。这种是最常见的。

第二种，百度、高德的地图都是瓦片地图，每一张瓦片在加载时都会去计算它的经纬度位置，我们可以在计算经纬度位置时加入纠偏算法，把瓦片的坐标位置纠偏回来。当所有瓦片的位置正确了，整个地图也就不存在偏移了。等于是把火星坐标或百度坐标的瓦片纠偏回wgs84坐标。

两种方案进行比较，第一种明显是被百度、高德的坐标转换接口带节奏了。leaflet是开源的，我们可以通过研究源码实现对瓦片的纠偏，从而真正实现对地图的纠偏，而不是每次去调用坐标转换接口，让数据将错就错。

第二种方案还可以进一步延伸，把对瓦片的纠偏封装成插件，最终目标是引入这个插件以后实现对地图的自动纠偏。



## 瓦片位置

对瓦片纠偏，先要找到加载瓦片、计算瓦片位置的代码在哪。

上文中提到的，加载互联网地图的插件[leaflet.ChineseTmsProviders](https://github.com/htoooth/Leaflet.ChineseTmsProviders)本质是一个图层，它继承了TileLayer

![](http://blogimage.gisarmory.xyz/20200920122157.png)

TileLayer继承了GridLayer

![](http://blogimage.gisarmory.xyz/20200920122321.png)

加载瓦片的代码主要是在GridLayer中写的。

计算瓦片位置的代码在 _getTiledPixelBounds 方法和 _setZoomTransform 方法中。

![](http://blogimage.gisarmory.xyz/20200920122956.png)

![image-20200920205535669](http://blogimage.gisarmory.xyz/20200920205538.png)



## 瓦片纠偏

瓦片纠偏分三步：

第一步：准备坐标转换的算法

![image-20200920124851802](http://blogimage.gisarmory.xyz/20200920204452.png)

第二步：根据互联网地图名称获取坐标类型

![image-20200920210646102](http://blogimage.gisarmory.xyz/20200920210648.png)

第三步：在获取瓦片和地图缩放的方法中，调用纠偏算法

![image-20200920211118437](http://blogimage.gisarmory.xyz/20200920211557.png)



## 封装成插件

有个问题，既然要封装成插件，就要做到耦合，不能直接修改leaflet的源码。这里可以参考leaflet的源码，使用 include 方式对方法进行重写来做到修改源码。

> include方式
>
> 通过例子了解一下：比如leaflet源码中 Polygon.toGeoJSON() 方法不是在 Polygon.js 文件中写的，而是用 include 方式写在了GeoJSON.js文件中。Polygon类本来是没有toGeoJSON()方法的，这样就增加了这个方法。如果Polygon类中已经有了toGeoJSON()方法，这样写会根据执行的顺序，后执行的会把先加载的重写。
>
> ![](http://blogimage.gisarmory.xyz/20200818073542.png)

最后，我们把上面的代码封装成一个js插件，大家引用这个插件，就能实现了对地图的纠偏，不需要写一行js代码，这才是我心目中真正的优雅。

## 最终效果

下图是引用纠偏插件前后的对比：

![](http://blogimage.gisarmory.xyz/20200917075946.gif)



> 注意：leaflet会以map初始化以后，加载的第一个图层的坐标，作为整个map的坐标，所以地图初始化以后，要第一个添加互联网地图作为底图。



## 总结

1. leaflet有一个加载国内互联网地图的插件，但存在坐标偏移问题。
2. 常见的偏移坐标有国测局坐标和百度坐标。网上有一份wgs84坐标国测局坐标和百度坐标相互转换的算法，需要自己集成到leaflet中
3. 纠偏算法集成到leaflet中有两种思路，一种是把自己的数据偏移到互联网地图，另一种是把互联网地图的瓦片纠偏回自己的数据。
4. 采用第二种思路，把纠偏算法封装成插件，对互联网地图的瓦片纠偏，在插件中复写源码的方式最为优雅。

## 在线示例

[在线示例](http://gisarmory.xyz/blog/index.html?demo=leafletMapCorrection)

[纠偏插件](http://gisarmory.xyz/blog/index.html?source=leafletMapCorrection)

不熟悉github的童鞋，可以微信搜索《GIS兵器库》或扫描下面的二维码，回复 “地图纠偏” 获得纠偏插件的下载链接。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



* * *

本文会经常更新，请阅读原文：[http://gisarmory.xyz/blog/index.html?blog=leafletMapCorrection，以避免被陈旧、错误的知识误导。

微信搜索《GIS兵器库》或扫描上文的二维码，关注GIS兵器库公众号， 可以第一时间获得GIS文章更新。

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。