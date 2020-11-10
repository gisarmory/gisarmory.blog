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

最开始以为是欧式方法



最后说一下开发时，这两种构建方法的实现方式



开发时，如何选择构建方法：

arcgis js api

arcgis js api中使用`geodesic`参数（[详情](https://developers.arcgis.com/javascript/3/jsapi/bufferparameters-amd.html)）来控制，true时使用测地线方法，false时使用欧式方法。

实现代码：

```javascript
var params = new BufferParameters();
params.geometries = [ geometry ];
params.distances = [ 500 ];
params.unit = BufferParameters.UNIT_KILOMETER;
params.geodesic = true;		//true时使用测地线方法，false时使用欧式方法
geometryService.buffer(params, showBuffer);
```

如果不设置，默认值取决于多个参数共同作用（[详情](http://server.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss000000nq000000)），下图是选择的逻辑树。

![image-20201024112550835](C:\Users\xiaolei\AppData\Roaming\Typora\typora-user-images\image-20201024112550835.png)





postGIS

postgis数据库中用 [ST_Buffer](http://www.postgis.net/docs/ST_Buffer.html) 函数来实现缓冲，函数会根据输入坐标的类型来决定使用测地线方法还是欧式方法。

![image-20201025112835533](C:\Users\xiaolei\AppData\Roaming\Typora\typora-user-images\image-20201025112835533.png)

 geometry 类型代表投影坐标。函数会使用欧式方法；geography 类型代表地理坐标，函数会使用测地线方法。

分析完成后返回的类型会和输入的类型保持一致。



geometry和geography都是二进制类型，而我们平时用的最多的类型是geojson，使用 [ST_GeomFromGeoJSON](https://postgis.net/docs/ST_GeomFromGeoJSON.html) 函数可以将geojson数据转换为geometry类型。

如果想要得到 geography 类型，



反过来使用 [ST_AsGeoJSON](https://postgis.net/docs/ST_AsGeoJSON.html) 可以将

下面的这个sql就是以天安门为中心，进行500公里的周边缓冲。输入和输出都使用geojson格式。

```sql
SELECT st_asgeojson(ST_Buffer(st_geomfromgeojson('{"type":"Point","coordinates":[116.391327,39.906329]}'),(500*1000) / (2 * pi() * 6371004) * 360))
```





truf中，xxxx。

## 总结：

1. buffer有两种构建方式，欧式方法和测地线方法
2. 欧式方法是在投影变形后的平面地图上计算缓冲，优点是效率高，缺点是结果有误差，误差大小取决于投影、位置、缓冲距离。
3. 测地线方法是在现实世界中画圆，再经过投影变形展示到地图上，优点是结果准确，不受投影和坐标的影响，缺点是计算复杂，大数据量时效率可能会有影响。
4. truf.js 只支持欧式方法，arcgis server 两种构建方式。
5. postGIS 支持两种构建方式，但欧式方法有bug。






参考：https://desktop.arcgis.com/zh-cn/arcmap/10.3/tools/analysis-toolbox/how-buffer-analysis-works.htm

https://developers.arcgis.com/javascript/latest/sample-code/ge-geodesicbuffer/index.html

http://www.postgis.net/docs/ST_Buffer.html



http://server.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss000000nq000000



https://developers.arcgis.com/javascript/3/jsapi/bufferparameters-amd.html



https://postgis.net/docs/using_postgis_dbmanagement.html#Geography_Basics



https://postgis.net/docs/PostGIS_Special_Functions_Index.html#PostGIS_GeographyFunctions