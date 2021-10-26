# 微信小程序添加外部地图服务数据

先上效果：

![](https://blogimage.gisarmory.xyz/wechartvectortile1.gif?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

## 缘起

使用微信小程序做地图相关功能的时候，有个需求是需要接入已发布的地图服务。查看微信小程序[地图组件](https://developers.weixin.qq.com/miniprogram/dev/component/map.html)文档，发现它对地图相关的支持很少，只有一些基础功能，比如添加点、线、面、气泡和一些常规的地图事件监听，并没有添加地图服务相关的支持。

不过有了需求，也要想办法解决呀。

## 图层查询

既然小程序不能直接添加地图服务，那就把图层数据查出来，然后通过添加点线面方式添加到地图，具体要怎么实现呢？

首先想到的是通过图层查询接口把所有数据查出来。

但是既然数据是按图层发布的，一般数据量都比较大，把所有数据查询出来，一次性添加过多的数据到地图，地图组件会受不了从而变的卡顿，另外微信小程序单次`setData()`的数据不能超过`1024kB`，因此这种方案就不可取了。

## 矢量瓦片

既然一次性请求数据量太大，是不是可以分批次请求呢？于是就想到了矢量瓦片。
矢量瓦片对于做`GIS`的人来说，大家都很熟悉了，这也是目前各种`GIS`产品对大数据量地图展示所采用的主要方式。
但是，我们如何让不支持添加外部图层的小程序地图组件支持矢量瓦片呢？

查看地图组件相关文档，会看到其中有个`regionchange`事件，该事件是在地图视野改变，也就是拖动、缩放地图时触发，它会返回当前中心点、缩放级别、地图范围等信息。

![](https://blogimage.gisarmory.xyz/20211025222420.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



## 获取瓦片

接下来就是如何根据这些参数获取到矢量瓦片了。

假设，地图切图的原点是`(originX,originY)`，地图的瓦片大小是`tileSize`，地图屏幕上1像素代表的实际距离是`resolution`。计算坐标点`（x,y）`所在的瓦片的行列号的公式是：

```js
col = floor((x0 - x)/( tileSize*resolution))
row = floor((y0 - y)/( tileSize*resolution))
```

这个公式应该不难理解，简单点说就是，先算出一个瓦片所包含的实际长度`LtileSize`，然后再算出此时屏幕上的地理坐标点离瓦片切图的起始点间的实际距离`LrealSize`，然后用实际距离除以一个瓦片的实际长度，即可得此时的瓦片行列号：`LrealSize/LtileSize`。

具体代码如下：

```js
getTileXY: function (lon, lat, level) {
  let originX = -180; //坐标系原点的x的值，
  let originY = 90; //坐标系原点的y的值
  //根据你自己对应的切片方案改，这个就是其分辨率resolution
  let resolution = [1.40625, 0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625,
    0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.0003433227539062,
    0.0001716613769531, 0.0000858306884766, 0.0000429153442383, 0.0000214576721191, 0.0000107288360596,
    0.0000053644180298, 0.0000026822090149, 0.0000013411045074, 0.0000006705522537, 0.0000003352761269
  ]

  let tileSize = 256 //这个值表示的是每张切片的大小,一般都是256
  let coef = resolution[level] * tileSize;
  let x = Math.floor((lon - originX) / coef); // 向下取整,丢弃小数部分
  let y = Math.floor((originY - lat) / coef); // 向下取整,丢弃小数部分
  let tmsY = Math.pow(2, (level - 1)) - y - 1;
  return {
    x: x,
    y: y,
    z: level - 1,
    tmsY: tmsY
  }
},
```



> 这里可以看到我返回的数据中有一个y值，还有一个`tmsY`，这是因为`WMTS`、`TMS`两种方式调用切片时，传入的y值是不同的，不过两者之间是有可以转换的，也就是`tmsY = Math.pow(2, (level - 1)) - y - 1`，`WMTS`用的是这里返回的y，`TMS`用的是这里返回 的`tmsY`。
>
> 参考链接：
>
> [WebGIS前端地图显示之根据地理范围换算出瓦片行列号的原理(核心)](https://www.cnblogs.com/zhaoyanhaoBlog/p/9026035.html)
>
> [Slippy_map_tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
>
> [TMS和WMTS大概对比](https://blog.csdn.net/yanqing0924/article/details/6066713  )



接下来我们只需根据当前地图可视范围的最大、最小坐标以及地图层级，即可获取包含当前地图可视范围的瓦片的编号。

由于微信小程序地图组件使用的是国测局加密坐标，而我发布的地图服务数据为`wgs84`坐标，因此这里在获取切片编号时需要用坐标转换方法将国测局坐标转成`wgs84`坐标，坐标纠偏方法可参考[leaflet中如何优雅的解决百度、高德地图的偏移问题](https://blog.csdn.net/gisarmory/article/details/108778991)。

```js
getXYZList: function (region, level) {
  // 坐标转换
  var newsouthwest = appcoord.gcj02_To_gps84(region.southwest.longitude, region.southwest.latitude); 
  var northeastwest = appcoord.gcj02_To_gps84(region.northeast.longitude, region.northeast.latitude);
  // 获取瓦片编号
  var xyzInfo1 = this.getTileXY(newsouthwest.lng, northeastwest.lat, level)
  var xyzInfo2 = this.getTileXY(northeastwest.lng, newsouthwest.lat, level)
  var z = level - 1
  for (var x = xyzInfo1.x; x <= xyzInfo2.x; x++) {
    for (var y = xyzInfo1.y; y <= xyzInfo2.y; y++) {
      this.getGeoJson(x, y, z)
    }
  }
},
```

然后通过`wx.request`传入请求地址以及x、y、z参数，即可获取到对应矢量切片的`geojson`格式数据

```js
getGeoJson: function (x, y, z) {
  const v = this
  wx.request({
    url: "http://127.0.0.1:7000/geoserver/gwc/service/wmts/rest/test:test/EPSG:4326/EPSG:4326:" +
      z + "/" + y + "/" + x + "?format=application/json;type=geojson",
    method: 'get',
    success(res) {
      var tileId = 'tile-' + x + '-' + y + '-' + z
      tileData[tileId] = {
        tileId: tileId,
        features: []
      }
      if(res.statusCode === 200){
        tileData[tileId].features = res.data.features
      }
      v.addFeatures(tileId)
    }
  })
},
```



> 注意，这里我是用`geoserver`发布的矢量瓦片，在调用过程中发现个问题，其中一个点图层瓦片返回的数据中，各个瓦片总有很多重复数据，经检查测试发现，这是由于发布该图层（点图层）时使用的样式为一张大小为`40x88`的图片点样，这就导致切图时整体向外缓冲了不少的像素值，所以，**如果`geoserver`发布的图层是用于矢量切片调用，最好将点图层样式设置为一个像素大小的像素点，这样可以有效减少瓦片数据冗余**



## 添加数据

最后在（再）通过微信小程序地图组件中添加点线面的方法把获取切片数据添加到地图即可

```js
addFeatures: function (tileId) {
  var polylines = this.data.polylines
  var markers = this.data.markers
  tileData[tileId].features.forEach(feature => {
    if (feature.geometry.type === 'LineString') {
      polylines.push(this.getPolyline(feature.geometry.coordinates, tileId))
    } else if (feature.geometry.type === 'Point') {
      markers.push(this.getMarker(feature.geometry.coordinates, tileId))
    }
  });
  this.setData({
    polylines: polylines,
    markers: markers
  })
},
```



## 存在问题

至此，微信小程序添加矢量瓦片数据已经完成，基本能满足浏览外部矢量图层的需求，但是，这里还是有一些不足的地方

1. 需要发布`geojson`格式矢量瓦片图层
2. 地图拖动时图层会闪一下，这是小程序重新往地图上绘制点线面图层引起的
3. 在小比例尺瓦片返回数据量较大时可能会有卡顿现象（可以通过限定最小比例尺优化）
4. 图层配图效果受小程序地图点线面样式限制

虽然该解决方案存在一些问题，但是鉴于微信小程序地图组件的限制，并且确时又有添加图层的需求，此方案还是可取的。



## 总结

1. 微信小程序地图组件不支持添加外部图层服务
2. 通过发布`geojson`格式矢量瓦片服务，然后按当前可视范围获取`geojson`格式瓦片数据
3. 通过小程序地图组件的`regionchange`事件监听地图拖动、缩放，可以获取到当前中心点、缩放级别、地图范围
4. 根据缩放级别、地图范围可以获取到当前可视范围的瓦片编号
5. 请求瓦片数据，通过微信小程序地图组件中添加点线面的方法把切片数据添加到地图



## 代码地址

代码地址：[http://gisarmory.xyz/blog/index.html?source=WechatVectorTile](http://gisarmory.xyz/blog/index.html?source=WechatVectorTile)



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=WechatVectorTile](http://gisarmory.xyz/blog/index.html?blog=WechatVectorTile)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





