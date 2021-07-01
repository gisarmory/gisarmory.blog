# mapboxgl绘制3D线
最近遇到个需求，使用`mapboxgl`绘制行政区划图层，要求把行政区划拔高做出立体效果，以便突出显示。

拿到这个需求后，感觉很简单呀，只需要用`fill-extrusion`方式绘制就可以啦，实现出来是这个样子的

![image-20210628224229898](https://blogimage.gisarmory.xyz/image-20210628224229898.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

效果有点丑，并且这里有个问题就是我的数据是区县数据，而绘制出的效果却没有区分出各个区县的边界
于是从下面两个方向做优化处理：

1. 各区县按不同颜色区分
2. 添加区县边界

首先尝试不同区县按颜色区分。这个简单，只需要设置`fill-extrusion-color`即可

![image-20210630230042058](https://blogimage.gisarmory.xyz/image-20210630230042058.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

设置完效果如下

![image-20210628224442854](https://blogimage.gisarmory.xyz/image-20210628224442854.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

效果好多了。

接下来继续尝试添加区县边界，之前也看到过类似效果，感觉应该也好实现

然鹅。。。

经过一番查找，发现发现`mapboxgl`可以对面进行拔高处理，但没有对线做拔高处理的方法，也就是说不支持绘制3D线。这可如何是好

既然线数据不能做拔高处理，那么把线处理成面总可以吧

于是从这个思路出发，按下面两步来操作

1. 对行政区划边界进行缓冲，这里需要用到`turf.js`的缓冲方法
2. 获取到缓冲后的边界面数据，再用`fill-extrusion`方式绘制



![image-20210628224546947](https://blogimage.gisarmory.xyz/image-20210628224546947.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

嗯，效果还不错

其实，这里还有个问题，由于这里的边界是按缓冲面的方式绘制，所以在地图缩放的时候边界的宽度不会像线那样按固定像素宽度显示，会出现放大地图的时候边线越来越宽，缩小地图的时候边线变越来越窄的问题

![image-20210628224822294](https://blogimage.gisarmory.xyz/image-20210628224822294.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

解决思路：按各层级分辨率分别对行政区划边界做缓冲计算，然后再分别对应显示在各个层级

> 各层级的`resolutions`，也就是各比例尺下地图分辨率，也就是一个像素代表的地图单位，这里要按米为单位进行缓冲，用的是`EPSG:900913`的分辨率，也就是各比例尺下一个像素代表多少米
>

核心代码如下

![image-20210701134504815](https://blogimage.gisarmory.xyz/image-20210701134504815.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

由于拿到数据的只有行政区划的`geojson`格式面数据，而缓冲时需要用的是线数据，因此需要对做面转线处理。

![image-20210701135130168](https://blogimage.gisarmory.xyz/image-20210701135130168.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



最终效果如下

![3DLine](https://blogimage.gisarmory.xyz/3DLine.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)




## 总结

1. 当对行政区划面数据做立体展示时，仅用`fill-extrusion`方式绘制，效果不好，无法显示边线
2. `mapboxgl`可以对面进行拔高处理，但没有对线做拔高处理的方法，也就是说不支持绘制3D线
3. 通过对边线数据缓冲，获取缓冲后面数据，当做边线使用
4. 由于单次缓冲半径固定，从而得到的缓冲面对大小固定，会出现地图缩放边线宽度也随着缩放的问题
5. 通过`resolutions`，逐级对边线处理，按层级显示，可以得到较好的显示效果




## 在线示例

在线示例：[http://gisarmory.xyz/blog/index.html?demo=MapboxGL3DLine](http://gisarmory.xyz/blog/index.html?demo=MapboxGL3DLine)

代码地址：[http://gisarmory.xyz/blog/index.html?source=MapboxGL3DLine](http://gisarmory.xyz/blog/index.html?source=MapboxGL3DLine)



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=MapboxGL3DLine](http://gisarmory.xyz/blog/index.html?blog=MapboxGL3DLine)。





关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 只给你网上搜不到的GIS知识技能

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。


