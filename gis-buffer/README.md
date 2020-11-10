# 为什么PostGIS对点进行buffer分析得到的是个椭圆

buffer - 图形缓冲区分析，GIS中最基本的空间分析之一。

实现buffer的工具有很多种，例如前端的truf.js、服务端的ArcGISserver、桌面端的ArcMap、数据库端的PosrGIS等都可以实现。

但最近在用 PostGIS 对点进行buffer分析时，得到的却是个椭圆。

![image-20201109210112613](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201109210112613.png)

为什么是椭圆，不应该是正圆吗？

要搞清楚这个问题，就得去研究buffer的原理。

buffer的构建方法有两种：欧式方法 和 测地线方法。

欧式方法是在二维平面地图上计算，这个二维地图是经过投影后的地图，地图投影时都会发生变形，欧式方法就是基于变形以后的平面地图来计算缓冲区。

测地线方法是在三维椭球体上计算，三维椭球体就是一个很接近地球真实形状球体，测地线方法就是基于这个球体的表面进行缓冲计算，再将计算结果经过投影变换，展示到地图上。

二者计算结果的区别是，欧式方法的计算结果在任何时候都是一个正圆，但把结果放到现实世界中却会存在误差。误差的大小，取决于选择的投影、缓冲的位置和缓冲的距离，以谷歌地图为例，它使用的是墨卡托投影，在地图上，赤道地区变形最小，越是向南北两极的高纬度地区，变形越大，最明显的就是格陵兰岛，它的面积只有中国大陆面积的1/4左右，但在地图上看，却比中国还要大。

测地线方法的计算结果在任何时候都更接近于现实，但要在二维地图上展示，就要进行地图投影，投影就会导致变形。

如果既要结果没有误差，又要展示不出现变形，怎么办？

用三维地图

三维地图不需要向二维地图那样进行投影变换，测地线方法计算的结果可以直接在上面进行展示，这样就不会出现变形。

下面中左侧是二维地图，右侧是三维地图，可以明显看出在高纬度地区，左侧已经出现变形，而右侧没有。

![image-20201109204728345](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201109204728345.png)



搞明白buffer的原理以后，再回过头来看开头出现的那个问题。

我的sql代码是这么写的

![image-20201110183817280](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110183817280.png)

缓冲500米的效果是这样的

![image-20201109210112613](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201109210112613.png)

我自己的理解是，这个属于欧式方法。

然后我又写了一个测地线方法，注意红框中是和上面的区别

![image-20201110184138590](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110184138590.png)

缓冲500米效果是这样的

![image-20201110184415635](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110184415635.png)

两个同时显示

![image-20201110184657159](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110184657159.png)

问题很明显，为啥测地线方法的结果是圆的，欧式方法的结果是椭圆的呢？这和前面我学习的原理对不上啊！

我又使用 truf.js 做500米的缓冲，缓冲结果和上面的图形叠加，效果是这样的

![image-20201110185227560](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110185227560.png)

我陷入了深深的思考。

感觉 truf.js 的这个应该是属欧式方法，查看 truf.js 的说明文档，只有一种缓冲方式，也没有相关说明解释是哪种。

看来要找个权威的来校准一下了，使用 arcgis server 的 buffer 接口试试，看看是啥效果。

代码

![image-20201110190244861](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110190244861.png)

效果如下，大圈的是测地线方法，小圈的是欧式方法

![image-20201110190339808](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110190339808.png)

这么看来，truf.js 就是只支持欧式方法，上面写的postGIS的测地线方法是正确的，欧式方法是有问题的。

那就再研究postGIS中的欧式方法

在调用arcgis server 的 buffer 接口时，注意到接口中传3个坐标相关的参数，`inSR` 输入图形的坐标，`outSR`输出图形的坐标，`bufferSR`缓冲时使用的坐标。

![image-20201110191005317](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110191005317.png)

同样的方式对标一下postGIS中，

传入和返回的也同样是`wgs84`的坐标，那缓冲时用的呢？

哦，明白了。缓冲时应该也是用的`wgs84`坐标，但`wgs84`本身是个没有经过投影的地理坐标，当在一个地理坐标上进行欧式方法的缓冲计算时，就出现了上面的那种奇怪现象。

嗯，有道理。转一下坐标试试，下图红框中就是坐标转换的过程，同时，因为使用投影坐标计算，buffer的距离参数可以直接使用米，不需要再转成弧度了。

![image-20201110191757338](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110191757338.png)

看结果，哈哈，完美！

![image-20201110192011776](C:\Users\HERO\AppData\Roaming\Typora\typora-user-images\image-20201110192011776.png)



## 总结：

1. buffer有两种构建方式，欧式方法和测地线方法
2. 欧式方法是在投影变形后的平面地图上计算缓冲，优点是效率高，缺点是结果有误差，误差大小取决于投影、位置、缓冲距离。
3. 测地线方法是在现实世界中画圆，再经过投影变形展示到地图上，优点是结果准确，不受投影和坐标的影响，缺点是计算复杂，大数据量时效率可能会有影响。
4. truf.js 只支持欧式方法。
5. arcgis server 支持两种构建方式。
6. postGIS 支持两种构建方式，但需要注意坐标的转换。

## 在线示例

文中用到的示例

postGIS同时直接两种buffer方式的函数脚本



参考文档：

https://desktop.arcgis.com/zh-cn/arcmap/10.3/tools/analysis-toolbox/how-buffer-analysis-works.htm

https://developers.arcgis.com/javascript/latest/sample-code/ge-geodesicbuffer/index.html

http://www.postgis.net/docs/ST_Buffer.html



http://server.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss000000nq000000



https://developers.arcgis.com/javascript/3/jsapi/bufferparameters-amd.html



https://postgis.net/docs/using_postgis_dbmanagement.html#Geography_Basics



https://postgis.net/docs/PostGIS_Special_Functions_Index.html#PostGIS_GeographyFunctions