# PostGIS管网连通性分析

对于管网数据分析的时候，经常遇到的一种需求就是管网连通性分析，接下来我们就使用postgis来实现该需求。

1. 首先将数据导入到`postgreSQL`数据库，我是从arcgis直接导入的，导入方式参考https://blog.csdn.net/eternity_xyf/article/details/80168029

2. 创建拓扑，生成`pipe_vertices_pgr`

   ![20210303001](https://blogimage.gisarmory.xyz/20210303001.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

3. 根据起点坐标、终点坐标从`pipe_vertices_pgr`查询最近的起点、终点标识

   ![20210303002](https://blogimage.gisarmory.xyz/20210303002.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

4. 调用pgr_kdijkstraPath函数，查询出起点、终点联通的线

   ![20210303003](https://blogimage.gisarmory.xyz/20210303003.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)





上面为整体分析思路，现在讲上述思路整理成函数，方便使用

1. 将步骤2生成`analysis_updatetopology()`函数
2. 将步骤3、4生成`analysis_connect()`函数
3. 调用`analysis_updatetopology()`函数，完成拓扑创建
4. 从地图选择起点、终点，然后调用`analysis_connect()`函数，得到分析结果



该分析适用于给水管网、排水管网、输油管道等管网的连通性分析，也可用于路网的最短路径分析



## 测试验证：

1. 在`postgtesql`数据库中创建新库库`postgis_test`

   ```sql
   create database postgis_pipetest
   ```

2. 下载[postgis_pipetest.bak](http://gisarmory.xyz/blog/index.html?source=PostGISPipeTest)备份文件，并[还原数据库](https://blog.csdn.net/jinjianghai/article/details/78657725)

   ```sql
   psql -h localhost -U postgres -d postgis_pipetest -f "D:\postgis_pipetest.bak"
   ```

3. 对管网数据表`pipe`创建拓扑

   ```sql
   select * from analysis_updatetopology('pipe')
   ```

4. 调用连通性分析函数

   ```sql
   -- 传入表名、起点坐标、终点坐标、容差值
   select * from analysis_connect('pipe',103.90893393,30.789659886,103.911700936,30.787850094,0.00001)
   ```

5. 获取geojson数据

   ```sql
   -- 所有管网geojson，这里用到ST_Affine方法，将坐标反转为[lat,lng]返回，这样leaflet可以直接循环添加
   SELECT '{ "type": "FeatureCollection", "features": [' || tt.Features || ']}' AS FeatureCollection
   FROM (
       SELECT ARRAY_TO_STRING(array(SELECT json_build_object (
               'type','Feature',
               'geometry',ST_AsGeoJSON (ST_Affine(shape,0,1,1,0,0,0)) :: json,
               'properties',to_jsonb(t)-'shape'
       ) :: TEXT AS geojson
       FROM (select flid,shape from pipe) AS t), ',') as Features
   ) tt
   ```

   ```sql
   -- 连通性分析结果geojson
   SELECT '{ "type": "FeatureCollection", "features": [' || tt.Features || ']}' AS FeatureCollection
   FROM (
       SELECT ARRAY_TO_STRING(array(SELECT json_build_object (
               'type','Feature',
               'geometry',ST_AsGeoJSON (shape) :: json,
               'properties',to_jsonb(t)-'shape'
       ) :: TEXT AS geojson
       FROM (select flid,shape from analysis_connect('pipe',103.90893393,30.789659886,103.911700936,30.787850094,0.00001)) AS t), ',') as Features
   ) tt
   ```

6. 分别将全部管网geojson数据和分析结果geojson数据添加到地图，即可验证分析结果

   

## 总结：

1. 该连通性分析适用于给水管网、排水管网、输油管道等管网的连通性分析，也可用于路网的最短路径分析
2. 调用`analysis_updatetopology()`函数创建拓扑
3. 从地图选择起点、终点，然后调用`analysis_connect()`函数，得到分析结果

## 示例

这个示例是文中用到的用于结果验证的示例，可以将geojson加入到该示例，验证分析结果

[结果验证示例](http://gisarmory.xyz/blog/index.html?demo=PostGISConnect)

## 函数脚本

[analysis_updatetopology函数脚本](http://gisarmory.xyz/blog/index.html?source=postGISbuffer)

[analysis_connect函数脚本](http://gisarmory.xyz/blog/index.html?source=PostGISConnect)





* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=postGISbuffer](http://gisarmory.xyz/blog/index.html?blog=postGISbuffer)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。