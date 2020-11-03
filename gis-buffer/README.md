# 为什么对点buffer分析得到的是个椭圆

buffer - 图形缓冲区分析，GIS中最基本的空间分析之一。

实现buffer的工具有很多种，例如前端的truf.js、服务端的ArcGISserver、桌面端的ArcMap、数据库端的PosrGIS等都可以实现。

但很多时候你会遇到标题中的那个问题，对点进行buffer分析得到的却是个椭圆。

为什么是椭圆，不应该是正圆吗？

要搞清楚这个问题，就得去研究buffer的原理。

buffer的构建方法有两种：欧式方法 和 测地线方法。

欧式方法是在二维平面地图上画圆，测地线方法是在三维椭球体上画圆。二者的区别是，二维平面地图是经过地图投影得到的地图，而三维椭球体没有。三维椭球体更接近于真实的地球，而二维平面地图在投影的过程中部分地区会出现变形。

而变形的程度，取决于选择的投影和所处的位置，以谷歌地图为例，它使用的是墨卡托投影的WGS84坐标系，墨卡托投影，圆柱投影的一种，这种投影的特点是，赤道地区变形最小，越是向南北两极的高纬度地区，变形越大，最明显的就是格陵兰岛

但在三维椭球体上进行缓冲，算法相对二维平面地图会更复杂很多，所以计算的效率会降低。



ArcGIS的这篇 [缓冲区（分析）的工作原理](https://desktop.arcgis.com/zh-cn/arcmap/10.3/tools/analysis-toolbox/how-buffer-analysis-works.htm) 就对前面的问题给出了很专业的回答。



欧式方法是在二维平面地图上画圆，测地线方法是在三维椭球体上画圆，二者各有优缺。

二维平面地图和三维椭球体的区别是，后者经过地图投影能够得到前者。

欧式方法的优点是算法简单，计算快。但因为









举个例子：

假设我们想要查看北京周边500公里的范围内有哪些城市，

欧式方法：找来一张纸质的世界地图，一个圆规，一把尺子。根据地图的比例尺换算出500公里在地图上的长度，然后用圆规以北京为中心，画一个圆。

测地线方法：找来一个软胶皮材质的地球仪，一个圆规，一把尺子。同样根据地球仪的比例尺算出500公里对应的长度，然后用圆规以北京为中心，画一个圆。

接下来，拆下地球仪，找到本初子午线，用剪刀沿本初子午线从南极点剪到北极点，将剪开的地球仪进行拉伸，摊平了。

摊平后再去看你之前画的那个圆，看它还圆不圆？

这个把地球仪摊平的过程就是类似地图投影的一个过程，现实中的圆展示到二维地图上，要进行投影转换，而这个投影转换会导致圆变形。

到这里，答案揭晓，对点进行buffer分析得到椭圆的原因，是因为**地图投影**导致的变形。

反过来讲，欧式方法在投影后的地图上画的那个圆，如果放到现实中，它也会变形。

通常变形的程度取决于使用的投影方法，和所处的位置。比如在utm投影中，离赤道越远，变形就越严重

那能不能用测地线方法得到一个在任何位置都不会变形的圆呢？答案是能，用三维地图。

地球是个球体，把三维的球体用二维的地图来展示就必须用到投影，但如果直接用三维地图展示，就不需要再投影，也就不会再发生变形。

如果我现在只有二维地图，应该用哪种构建方式呢？

看用途，正常情况下我们都应该使用测地线方法，因为它是对真实世界的表达。但如果你遇到了一个很在意buffer结果圆不圆的客户或领导，而你又解释不明白的时候，用欧式方法也是一种解脱。



最后说一说开发时，这两种构建方法的实现方式



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
2. 欧式方法是在投影变形后的平面地图上绘制图形，看上去很圆，但在现实中并不准确。
3. 测地线方法是在现实世界中画圆，再经过投影变形展示到地图上，看上去不圆，但实际是准确的。
4. 
5. arcgis server、postGIS 的buffer提供了两种构建方式，truf只提供了xx的构建方式。






参考：https://desktop.arcgis.com/zh-cn/arcmap/10.3/tools/analysis-toolbox/how-buffer-analysis-works.htm

https://developers.arcgis.com/javascript/latest/sample-code/ge-geodesicbuffer/index.html

http://www.postgis.net/docs/ST_Buffer.html



http://server.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss000000nq000000



https://developers.arcgis.com/javascript/3/jsapi/bufferparameters-amd.html



https://postgis.net/docs/using_postgis_dbmanagement.html#Geography_Basics



https://postgis.net/docs/PostGIS_Special_Functions_Index.html#PostGIS_GeographyFunctions