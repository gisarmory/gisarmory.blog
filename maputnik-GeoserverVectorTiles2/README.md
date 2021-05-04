# 如何不改源码让maputnik支持geoserver

前段时间分享了[如何让矢量瓦片配图神器maputnik支持 geoserver](http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles)，文章中的解决方案是，通过修改maputnik源码，在界面上增加tms协议选项，从而让maputnik支持geoserver发布的矢量瓦片。

前两天工作发现，不修改maputnik源码，也能让它支持geoserver矢量瓦片。

**原理如下：**

1. maputnik本质上是mapboxgl style文件的编辑器，style文件是个json格式数据。
2. mapboxgl本身是支持geoserver tms协议矢量瓦片的，在style文件中进行相关配置就可以实现。

3. maputnik中的地图使用mapboxgl实现，不支持geoserver是因为界面上没有配置tms协议的选项，导致无法生成包含tms协议配置的style文件。

4. maputnik支持style文件的导入、导出、编辑功能，我们可以在配置geoserver数据源后，导出style文件，在style文件中手工添加tms协议相关配置，再导回maputnik，从而让它支持geoserver矢量瓦片。


**具体操作方法如下：**

1. 打开maputnik，配置geoserver数据源。
   ![](http://blogimage.gisarmory.xyz/20210504150744.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)
2. 把style文件下载到本地。
   ![](http://blogimage.gisarmory.xyz/20210504150857.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)
3. 打开下载的style文件，在source中找到刚添加的geoserver数据源，手动添加tms协议选项。
   ![](http://blogimage.gisarmory.xyz/20210504152307.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)
4. 重新导入style文件。
   ![](http://blogimage.gisarmory.xyz/20210504152323.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)
5. 后续添加的geoserver图层就能正常显示了。
   ![](http://blogimage.gisarmory.xyz/20210504152339.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)
   ![](http://blogimage.gisarmory.xyz/20210504152350.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

**和之前修改源码的方案比较：**

1. 这次的方案简单灵活，普适性强，后续再遇到类似mapboxgl支持但maputnik不支持的问题，都可以使用这种方式快速解决。
2. 修改源码的方案对于react框架不熟的同学可能比较吃力，但如果解决了，后续使用就会很方便，一劳永逸。

**总结：**

1. style 文件是 maputnik 和 mapboxgl 连接的唯一纽带。
2.  maputnik 本质上是一个mapboxgl style 文件的编辑器。
3. maputnik 没有覆盖到 style 文件的所有选项，导致它不支持geoserver的矢量瓦片。
4. maputnik 没有覆盖到的选项，可以通过导入、导出功能，手工编辑 style 文件来实现。

<br/>

<br/>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles2](http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles2)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





