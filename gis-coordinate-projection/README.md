# 未经投影的地理坐标系如何显示为平面地图



## 缘起

使用`Leaflet`做点缓冲，也就是调用“`L.circle()`”绘制圆形，传入半径100米，绘制出来的圆却覆盖了全球，当时就猜想，应该是把半径按100度来绘制了，但看了`Leaflet API`介绍，里面描述的半径单位就是用的“米”。

![image-20220126160209654](https://blogimage.gisarmory.xyz/image-20220126160209654.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

然后想起来这次用的地图底图为天地图，在初始化地图时，通过修改`crs`，将地图坐标系修改为了“`EPSG:4490`”（通过[Proj4Leaflet](https://github.com/kartena/Proj4Leaflet)定义），而`Leaflet`默认采用的是“`EPSG:3857`”，看来问题应该是出在了这里。

![2022021901](https://blogimage.gisarmory.xyz/2022021901.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

于是通过三角函数，将100米换算成度再次绘制，可以成功绘制。

```js
const newRadius = Math.asin(radius / 6371000) * 180 / Math.PI //将米转为度，6371000为地球赤道半径
```

然后就引发了思考，“`EPSG:4490`”是地理坐标系，也叫球面坐标系，默认应该是个球，而二维地图是个平面，球要在平面展示就需要投影，那么未经投影的“`EPSG:4490`”坐标系是如何绘制到平面上的呢？

接下来就研究下地理坐标系和平面坐标系，以及未经投影的地理坐标系到底是如何显示为平面地图的。

 

## 基础概念

首先了解几个基础概念：

**地理坐标系**：或称球面坐标系，参考平面是椭球面，一般是指由经度、纬度和高度组成的坐标系，能够标示地球上的任何一个位置。常见的地理坐标系有`WGS84`（`EPSG:4326`）、`CGCS2000`（`EPSG:4490`）、`GCS_Xian_1980`（`EPSG:4610`）。

**投影**：地理坐标系是三维的，而我们要在地图或者屏幕上显示就需要转化为二维，这个过程被称为**[投影](https://en.wikipedia.org/wiki/Map_projection)**。常用的投影有[墨卡托投影](https://en.wikipedia.org/wiki/Mercator_projection)（`Mercator`）、[高斯-克吕格投影](https://en.wikipedia.org/wiki/Transverse_Mercator_projection)、[伪墨卡托投影](https://en.wikipedia.org/wiki/Web_Mercator_projection)（`Web Mercator`）。

**投影坐标系**：经过投影后的坐标系就是投影坐标系，坐标单位一般是米、千米等。可以认为投影坐标系就是**地理坐标系+投影**。常见的投影坐标系有`EPSG:3857`（也就是`WGS84` +伪墨卡托投影）。

## 经纬度等间隔直投

了解上面这几个概念后，回到开头的问题，地理坐标系“`EPSG:4490`”或者“`EPSG:4326`”，是如何显示到平面上的呢？

其实在我们使用二维方式展示地图，而坐标系为地理坐标系时，用到了是一种特殊的投影方式，**经纬度等间隔直投**。

**经纬度等间隔直投**：英文叫法是`Platte Carre projection`，是[**等距矩形投影**](https://en.wikipedia.org/wiki/Equirectangular_projection)（`Equirectangular projection`）基准点纬度取0°（赤道）时的特殊情况。它的特点是相同的经纬度间隔在屏幕上的间距相等，没有复杂的坐标变换。我们可简单的理解为，在笛卡尔坐标系中，将赤道作为X轴，子午线作为Y轴，然后把本来应该在南北两极相交的经线一根一根屡直了，成为了互相平行的经线，而每条纬线的长度也在这个过程中都变为与赤道等长。

在经纬度等间隔直投中，经度范围是`-180`到`180`，纬度范围是`-90`到`90`，因此他的地图是长方形，且长宽比是`2:1`。

在地图`API`中，当定义地图坐标系为地理坐标系时，一般会默认采用这种投影方式，这也是我们能看到地理坐标系的平面地图的原因。

![20220128](https://blogimage.gisarmory.xyz/20220128.jpg?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



但是经纬度等间隔直投有个很明显的缺点，就是在低纬度地区长度、角度、面积、形状变化比较小，越向高纬度，水平距离变长越大，很小的纬圈都变得和赤道一样长，但是经线长度始终保持不变。这样就导致要素经过投影后会角度会发生变化，比如非常标准的十字路口，两条路“非常垂直”，而经过“经纬度等间隔直投”投影后，两条路成了斜交。

正是由于经纬度直投的这些缺点，特别是投影后角度的变化，导致它在一些领域是无法应用的，比如说航海中航线的表达（本来的直角转弯，在地图上显示的可能是钝角或锐角）。

当然，要把球面坐标投影到平面展示，不可避免都会产生这样那样的变形，而每种地图投影也都有自己的优点和缺点，这就需要我们根据不同的应用场景来选择合适的投影了。

接下来我们再了解下日常最常见的一种投影，墨卡托投影，然后再将经纬度等间隔直投和墨卡托投影做下对比，这样可以更直观的观察出各自的优缺点。

## 墨卡托投影

**墨卡托投影**，又名“等角正轴圆柱投影”，荷兰地图学家墨卡托（Mercator）在1569年拟定，假设地球被围在一个中空的圆柱里，其赤道与圆柱相接触，然后再假想地球中心有一盏灯，把球面上的图形投影到圆柱体上，再把圆柱体展开，这就是一幅标准纬线为零度（赤道）的“墨卡托投影”绘制出的世界地图。



![2022012601](https://blogimage.gisarmory.xyz/2022012601.jpg?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

墨卡托投影最大优点就是在地图上保持方向和角度的正确，如果循着墨卡托投影地图上两点间的直线航行，方向不变，可以一直到达目的地，因此它对船舰在航行中定位、确定航向都具有有利条件，给航海者带来很大方便。这也是目前的大部分互联网地图选择墨卡托投影（伪墨卡托投影或者基于墨卡托投影做加密偏移）的原因之一，因为人们希望在地图上看到的地物与实际地物长得相似，并且导航方向不变。

> `Web Mercator`投影，也就是“`EPSG:3857`”，也被称为“伪墨卡托投影”，这个投影方法是`Google Map`最先发明并使用的，它的地理上的不严谨性在于，在投影过程中，将表示地球的椭球面作为正球面处理，传说中是因为谷歌程序员懒得用椭球面来编程计算屏幕坐标...想具体了解，可以参考[Web Mercator 公开的小秘密](https://blog.csdn.net/kikitamoon/article/details/46124935)

对于墨卡托投影来说，也有个明显的缺点，就是越到高纬度，大小扭曲越严重，到两极会被放到无限大，因此墨卡托投影并不能表现出南北两极。为了方便使用，互联网地图使用的`Web Mercator`投影，通过对两极地区的裁剪，把地图搞成一个正方形，这样在定义缩放级别、地图切图等处理时就会更清晰易懂。具体相关原理计算可参考https://www.jianshu.com/p/434feafd40a7。

通过下图，可以看到墨卡托投影下每个国家的大小和实际大小的差异。

![2022012605](https://blogimage.gisarmory.xyz/2022012605.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

下面两张图片来自天地图网站截图，我们可以看出，地图层级同样是18级，黑龙江漠河（上图）与海南三亚（下图）的地图比例尺差别还是很大的。

![20220216011](https://blogimage.gisarmory.xyz/20220216011.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

![20220216021](https://blogimage.gisarmory.xyz/20220216021.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



## 经纬度等间隔直投 VS 墨卡托投影

下图来自 [**Mercator vs. well…not Mercator (Platte Carre)**](https://idvux.wordpress.com/2007/06/06/mercator-vs-well-not-mercator-platte-carre/)，生动地说明**经纬度等间隔直投**（`Platte Carre`）和 **墨卡托投影**（`Mercator`）这两种投影下的失真情况：

![2022012604](https://blogimage.gisarmory.xyz/2022012604.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

左图表示地球球面上大小相同的圆形，右上为墨卡托投影，投影后仍然是圆形，但是在高纬度时物体被严重放大了。右下为经纬度等间隔直投，圆的大小变化相对较小，但是高纬度时的图像明显被拉长了。

查看天地图传统版网站https://map.tianditu.gov.cn/2020/，可以切换下投影方式，对比看一下不同投影的区别（可以把地图拖到哈尔滨地区，区别更明显）。通过下面动态图可以看出不同投影在哈尔滨地区的差异，其中“球面墨卡托”，采用的是web墨卡托投影（`EPSG:3857`）；“经纬度”，采用的是`EPSG:4326`的经纬度等间隔直投。

![2022021001](https://blogimage.gisarmory.xyz/2022021001.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



## 总结

1. 未经投影的地理坐标系之所以可以显示为平面地图，是因为它默认采用了**经纬度等间隔直投**的投影方式。
2. 大部分互联网地图都是采用`Web Mercator`（`EPSG:3785`），或者是基于`Web Mercator`做了加密偏移。
3. **经纬度等间隔直投**在高纬度地区的平面变形严重，大小和角度都会发生明显变化。
4. **`Web Mercator`**在高纬度地区的平面会明显被拉大，但是角度不会发生变化。
5. 对于地图投影，没有最好的，只有最合适的，需要根据自己的应用场合来选择。



**参考资料：**

1. https://blog.csdn.net/kikitamoon/article/details/46124935
2. https://idvux.wordpress.com/2007/06/06/mercator-vs-well-not-mercator-platte-carre/
3. https://en.wikipedia.org/wiki/Map_projection
4. https://en.wikipedia.org/wiki/Equirectangular_projection
5. https://en.wikipedia.org/wiki/Mercator_projection
6. https://www.jianshu.com/p/434feafd40a7



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=gis-coordinate-projection](http://gisarmory.xyz/blog/index.html?blog=gis-coordinate-projection)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





