# leaflet如何加载10万数据

**标签**：leaflet、svg、Canvas、插件、海量点、海量数据、Canvas-Markers、Leaflet.Canvas-Markers、性能

* * *



作为一名GIS开发者，你工作中一定遇到过这种问题，根据业务设计，需要在地图上添加1万+条数据，数据或是点、或是线、或是面。但不管哪种，当你添加到5000条时，地图操作就会出现明显的卡顿。当你添加超过1万条时，数据加载就会卡顿，浏览器出现卡死的状态，地图加载后，每挪动一下地图，都要耐心的等待上几秒钟。

这种交互体验，用户是肯定接受不了的，解决方法通常分两种，一种是去做深入的用户需求分析，看用户想一次性加载这么多数据是为了看什么，想看的这个东西，通过其它技术方式能不能实现。另一种就是死磕技术，研究如何提升地图性能。我们今天只讨论第二种情况。

## canvas渲染方式

leaflet支持两种渲染方式，svg 和 canvas，默认是svg渲染，这样可以兼容低版本的IE浏览器。canvas渲染需要IE9+，或谷歌、火狐的高版本浏览器。canvas比svg性能好，我自己做了简单的测试，svg模式加载5000个图片标记时出现的卡顿情况，用canvas模式，加载10万条数据时才会出现。

下面讲如何完全切换到canvas模式，共两步：

一，在初始化地图时，设置map的 preferCanvas 属性为 true，代码如下：
```js
var map = L.map('map', {
    center: [39.905963, 116.390813],
    zoom: 13,    
    preferCanvas: true
});
```

这个设置只针对继承了Path类的矢量图层有效，包括圆点（CircleMarker）、线（Polyline）、面（Polygon）、圆（Circle）、矩形（Rectangle）。针对图片标记（Marker）没有作用。
![](http://q9qtw0qww.bkt.clouddn.com/20200503152339.png)

二、借助插件 Leaflet.Canvas-Markers，提升Marker的显示性能。插件git地址：[https://github.com/eJuke/Leaflet.Canvas-Markers](https://github.com/eJuke/Leaflet.Canvas-Markers)
![](http://q9qtw0qww.bkt.clouddn.com/20200504135302.png)

## Leaflet.Canvas-Markers 插件

Leaflet.Canvas-Markers 插件提供了一个 `L.canvasIconLayer` 类，这个类是一个图层，将 Marker 添加到这个图层中时，这个图层会以 canvas 方式渲染 Marker 中的图片。

### 如何使用

在html中引入插件
``` html
<script src="leaflet.canvas-markers.js"></script>
```
创建canvasIconLayer图层，把图层添加到地图，给图层添加图片标记。
```js
// 创建图层，添加到 map
var ciLayer = L.canvasIconLayer({}).addTo(map);

// 定义 Marker
var marker =  L.marker([58.5578, 29.0087], {icon: icon});

// 把 Marker 添加到图层
ciLayer.addMarker(marker);
```

### 注意

这个插件有个问题，就是地图缩放时，添加的数据不跟着同步缩放，而是等到缩放完成后，再去缩放。这样感觉缩放时，数据在飘着。
![](http://q9qtw0qww.bkt.clouddn.com/20200504145945.gif)


不过已经有人对这个问题提出了解决方案，并且解决了（[链接](https://github.com/eJuke/Leaflet.Canvas-Markers/pull/21)），只是代码一直没有被合并。不过这都没有关系，我们可以去用那份儿已经解决的代码（[链接](https://github.com/corg/Leaflet.Canvas-Markers)）

**解决以后的效果：**
![](http://q9qtw0qww.bkt.clouddn.com/20200504151120.gif)




## 完整代码

注意：这份代码因为是引用的在线地址，所以存在上文中说的缩放地图时感觉飘的问题，
```html

<!DOCTYPE html>
<html>
<head>
  <title>leaflet-canvas-marker</title>
  <meta charset="utf-8" />
  <!-- 引入leafletapi -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.1/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.3.1/dist/leaflet.js"></script>
  <!-- 引入leaflet-canvas-marker插件 -->
  <script src="https://unpkg.com/leaflet-canvas-marker@0.2.0"></script>
  <style>
    body { margin: 0; }
    .map {position: absolute; height: 100%; right: 0; left: 0; }
  </style>
</head>
<body>
  <div class="map" id="map"></div>
  <script>
    var map = L.map('map',{
      center: [39.905963, 116.390813],
      zoom: 14,
      preferCanvas: true    //使用canvas模式渲染矢量图形 
    });
    //添加底图
    var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
    //使用canvas模式渲染marker
    var ciLayer = L.canvasIconLayer({}).addTo(map);
    var icon = L.icon({
      iconUrl: 'https://ejuke.github.io/Leaflet.Canvas-Markers/examples/img/pothole.png',
      iconSize: [20, 18],
      iconAnchor: [10, 9]
    });
    for (var i = 0; i < 10000; i++) {
      var lat = 39.905963 + (Math.random()-Math.random()) * 3;
      var lng = 116.390813 + (Math.random()-Math.random()) * 3;
      var marker = L.marker([lat, lng], { icon: icon })
        .bindPopup("I Am " + i);    //绑定气泡窗口
      ciLayer.addLayer(marker);
    }
    
  </script>
</body>
</html>


```

## 总结

1. leaflet支持两种渲染方式，svg 和 canvas，canvas的显示性能要明显优于svg。
2. IE9之前版本浏览器不支持canvas方式渲染。
3. 默认是svg方式渲染，要手动切换成canvas方式。
4. 渲染方式设置成canvas后，加载矢量图形性能会提升，加载图片标记的效率仍然低。
5. 通过Leaflet.Canvas-Markers插件来提升图片标记的显示效率。
6. Leaflet.Canvas-Markers插件在缩放地图时有bug，需要在github上找已经解决此bug的版本。













