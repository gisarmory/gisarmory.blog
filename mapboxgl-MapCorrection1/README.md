# mapboxgl 互联网地图纠偏插件（一）

之前写过一个 [leaflet 互联网地图纠偏插件](http://gisarmory.xyz/blog/index.html?blog=leafletMapCorrection)，引用插件后一行代码都不用写，就能解决国内互联网地图瓦片的偏移问题。

最近想对 mapboxgl 也写一个这样的插件。

原因是自己发布的OSM矢量瓦片地图精度不够高，当需要放大地图查看详细信息时，就可以拿百度、高德的栅格瓦片做个补充。而使用它们的第一步就是要先纠偏。

去研究了 mapboxgl 的底层代码，发现很多都看不懂。于是去恶补了 webgl 的知识，再去看 mapboxgl 的源码，哈哈，万变不离其宗，GIS知识还是那些，只是计算机绘制图形的方式变了而已。

研究后，把目标锁定在了 transform.js 文件上，这个文件主要用来处理各种坐标转换问题，包括经纬度坐标、墨卡托坐标、屏幕坐标、webgl坐标等，还负责生成瓦片的编号。

文件中的 coveringTiles 方法就是用来计算瓦片的 x、y、z 编号的，它会返回当前比例尺和可视范围内的所有瓦片编号。

![](http://blogimage.gisarmory.xyz/20210617192140.png)



根据 x、y、z 瓦片编号请求到互联网地图瓦片后，会在 calculatePosMatrix 方法里计算瓦片显示的屏幕位置。

![](http://blogimage.gisarmory.xyz/20210617192149.png)



mapboxgl 和 leaflet 的显示原理不同，mapboxgl 是三维坐标系，使用webgl绘图，增加了一个维度后，多出了很多东西要处理，二维坐标系加载瓦片时，只需要考虑瓦片的 x、y 位置，三维坐标系在此基础上还要考虑倾斜和透视。

webgl 的坐标都是通过位置变换矩阵来表示的，这一点和leaflet的差别很大。

上面的 calculatePosMatrix 方法就是根据瓦片的 x、y、z 编号，计算出瓦片在 webgl 中显示的位置变换矩阵。这里分别将瓦片的平移矩阵、缩放矩阵和视图+投影矩阵进行了相乘，得到了最终的位置变换矩阵。

> 看这个方法时我有些疑惑，它是如何根据瓦片的 x、y、z 编号来计算位置变换矩阵的，去研究了xyz协议后，才明白xyz坐标和经纬度坐标是有一套互转公式的，瓦片编号转经纬度时返回的坐标是瓦片左上角的经纬度。详见：[https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
>

> 关于 webgl 变换矩阵的知识可以参考这篇文章 [https://www.cnblogs.com/charlee44/p/11623502.html](https://www.cnblogs.com/charlee44/p/11623502.html) 或 [《WebGL编程指南》](https://github.com/linghuam/boutique-books/tree/master/b04-%E5%9B%BE%E5%BD%A2%E5%AD%A6%E4%B8%8E%E5%8F%AF%E8%A7%86%E5%8C%96)，我更推荐后者，因为后者讲的更系统更容易理解。

不得不说，webgl 的位置变换矩阵计算还是有一些复杂的，所以就想看看 mapboxgl 中有没有内置经纬度坐标和 webgl 坐标互转的方法，查看后发现，只有经纬度坐标、墨卡托坐标和屏幕坐标三者互转的方法，没有 webgl 的。

那就曲线救国，先将经纬度转成屏幕坐标，再自己写个方法把屏幕坐标转成 webgl 坐标。

实现思路：

1. 根据瓦片编号和经纬度的互转公式，计算出瓦片左上角的经纬度
2. 对瓦片左上角的经纬度进行纠偏，得到 wgs84 坐标的经纬度
3. 将纠偏前、后的经纬度分别转为屏幕坐标，再将转换后的屏幕坐标相减，得出瓦片屏幕坐标的偏移量
4. 将瓦片屏幕坐标的偏移量换算成 webgl 坐标的偏移量
5. 在瓦片的平移矩阵中加上刚才计算出的 webgl 坐标偏移量，理论上就能实现对瓦片的纠偏

在实现过程中，将 1、2、3 步搞定以后，因为暂时还没有想好怎么实现第4步，于是就先将第 3 步的结果屏幕坐标偏移量，直接加到了第 5 步的平移矩阵中，结果很让人意外。

实现代码：

![](http://blogimage.gisarmory.xyz/20210617192156.png)



实现效果：

以天安门国旗为参照，纠偏前

![](http://blogimage.gisarmory.xyz/20210617173332.png)



纠偏后

![](http://blogimage.gisarmory.xyz/20210617173335.png)



哈哈，难道就这么搞定了？

难道平移矩阵中的数值都是按屏幕像素来计算的？

至少目前看来是的。



正当我开心的不要不要时，咦？边上为什么会有空白，瓦片没有请求过来？我接着放大地图，白边越来越大了

![](http://blogimage.gisarmory.xyz/20210617173338.gif)



嗯~ 这个好解决，应该是因为 mapboxgl 只显示当前范围的瓦片，当屏幕边缘的瓦片被纠偏到屏幕中间时，边缘就会出现空隙。

只要将当前显示范围向外扩展一些就能搞定。

正当我在开心的研究如何向外扩展显示范围时，无意中把地图倾斜了一下，我的妈呀！这是什么鬼

![](http://blogimage.gisarmory.xyz/20210617173342.gif)



看到这个，我当时的心情瞬间就不好了。

~~  容我整理下心情  ~~

好了，个人猜想，原因可能是，在地图旋转时，瓦片根据 webgl 坐标的中心点计算要旋转的角度和移动的距离，现在瓦片纠偏后位置发生了偏移，但计算旋转坐标时，还是根据webgl的中心点，所以旋转时就出问题了。

具体我也没想明白呢，感觉还是对瓦片纠偏后，需要对某个中心点也需要纠偏一下。如果有技术大牛看到这篇文章也可以给留言指导一下。

总结：

1. 目前搞定了垂直视角下的瓦片纠偏
2. 后续需要解决纠偏后屏幕边缘出现的空白区域问题。
3. 地图倾斜和旋转时瓦片会出现错位，需要继续研究。

最后，mapboxgl纠偏插件还没有完全搞定，就不放代码了，后续有新进展会再跟大家分享，等完全搞定以后再向以前一样跟大家分享插件。

<br>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection1](http://gisarmory.xyz/blog/index.html?blog=mapboxglMapCorrection1)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





