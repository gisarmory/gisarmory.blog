

## 缘起

近期在项目中遇到这么一个需求，需要在地图上展示一组格网数据，格网大小为`2m*2m`，地图`api`用的`mapboxgl`。起初拿到这个需要感觉很easy，在地图上添加一个`fill`图层就好啦。把格网面数据添加到地图上之后，在大比例尺下显示正常，但是当地图层级小于15级时，渲染出的结果会消失。

![](https://blogimage.gisarmory.xyz/202208220001.gif)

简单理一下原因，应该是在地图缩小后，每个网格所占的像素太小，所以就消失了。

> `mapboxgl`在处理`symbol`图层的时候，会遇到点位自动避让问题，导致部分点位不显示。解决方法是把`layout`中的`icon-allow-overlap`设置为`true`，这样就相当于关闭了自动避让功能，所有点图标保持可见状态。但是针对`fill`图层却没有这么一个属性。

但是这种情况又需要查看数据，要如何实现呢？



首先分析下数据，我的原始数据是通过模型导出的`tiff`格式的栅格数据，然后在后台根据``tiff``格式数据中每个像素所在行列号以及其灰度值生成带属性的格网数据，其中像素的灰度值就是在渲染时需要分类展示的值。既然原始`tiff`数据的灰度值就是所用的属性值，那是不是直接添加到地图就好了。接下来的解决方案就是看是否能直接用`mapboxgl`直接加载`tiff`数据，并渲染出自己想要的效果。

## mapboxgl加载tiff

查看`mapboxgl`文档，可以看到`mapboxgl`支持`image`图层，只需传入url和coordinates

```css
// 添加至地图
map.addSource('some id', {
  type: 'image',
  url: 'https://www.mapbox.com/images/foo.png',
  coordinates: [
    [-76.54, 39.18],
    [-76.52, 39.18],
    [-76.52, 39.17],
    [-76.54, 39.17]
]});
```

可是，当我把地址换成`tiff`数据时却报错了。下面为报错内容：

> Could not load image because of The source image could not be decoded.. Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported

可以简单理解为不支持`tiff`格式。

## tiff文件解析

既然`mapboxgl`的`image`图层不支持`tiff`格式，那是不是可以把`tiff`数据导出成`png`呢，于是使用`arcmap`打开了`tiff`数据，导出数据格式也支持`png`，但是在保存时又报错了。

![](https://blogimage.gisarmory.xyz/202208220001.png)

经过分析，发现是`tiff`数据波段数量的原因，我的这份数据波段数为1，从网上下载了一份测试数据，波段数为3，可以成功导出。

![](https://blogimage.gisarmory.xyz/202208220002.png)

在查找相关解决方案的时候，看到这么个工具，[geotiff.js](https://geotiffjs.github.io/geotiff.js/)，可以通过`js`解析`tiff`数据并渲染，`leaflet`有个扩展就是用的这个工具，https://github.com/stuartmatthews/leaflet-geotiff。查看`geotiff.js`相关文档，发现其实用起来还是挺方便的，通过简单的代码实现的我的需求。

先使用`geotiff.js`解析`tiff`数据，再配合使用`canvas`绘制图片导出`base64`格式数据，然后就可以使用添加到`mapboxgl`图层了。

核心代码如下：

```js
async function getData() {
  GeoTIFF.fromUrl(url).then(tiff => {
    console.log(tiff)
    getImage(tiff)
  });
}
async function getImage(tiff) {
  const image = await tiff.getImage();
  let bbox = await image.getBoundingBox();
  let data = await image.readRasters({
    samples: rgbBands // 波段数量，一个波段：[0]，三个波段：[2,1,0]
  });
  let base64Image = getBase64Image(data)
  addToMapboxgl(base64Image)
}
function getBase64Image(data) {
  let thumbnailPixelHeight = data.height
  let thumbnailPixelWidth = data.width
  let canvas = document.createElement('canvas')
  canvas.width = thumbnailPixelWidth
  canvas.height = thumbnailPixelHeight
  let ctx = canvas.getContext("2d")
  let totalPixelCount = 0
  for (let y = 0; y < thumbnailPixelHeight; y++) {
    for (let x = 0; x < thumbnailPixelWidth; x++) {
      let colour = 'rgb(0, 0, 0, 0)' // let the default be no data (transparent)
      // 根据灰度值所在范围渲染颜色
      if (data[0][totalPixelCount] > 0) {
        if (data[0][totalPixelCount] > 50 && data[0][totalPixelCount] <= 55) {
          colour = `rgb(15, 255, 0, 1)`
        } else if (data[0][totalPixelCount] > 55 && data[0][totalPixelCount] <= 60) {
          colour = `rgb(155, 255, 0, 1)`
        } else if (data[0][totalPixelCount] > 60 && data[0][totalPixelCount] <= 65) {
          colour = `rgb(255, 255, 0, 1)`
        } else {
          colour = `rgb(255, 255, 0, 1)`
        }
      }
      ctx.fillStyle = colour
      ctx.fillRect(x, y, 1, 1)
      totalPixelCount++
    }
  }
  let canvasImage = canvas.toDataURL("image/png")
  return canvasImage
}
// 将图片添加到地图
function addToMapboxgl(image) {
  map.addSource('tiff-source', {
    "type": "image",
    "url": image,
    "coordinates": [
      [114.425597191307, 38.1091563484708],
      [114.538187627939, 38.1091563484708],
      [114.538187627939, 37.9627378349512],
      [114.425597191307, 37.9627378349512]
    ]
  });
  map.addLayer({
    id: 'tiff-layer',
    'type': 'raster',
    'source': 'tiff-source',
    'paint': {
      'raster-fade-duration': 0
    }
  });
}
```

本以为到这里问题已经解决，但是在查看地图时，发现图片图层数据叠加到底图有不小的偏移。

经过一番对比分析，发现原来是`tiff`数据的坐标系与地图坐标系不一致的导致的。我拿到的`tiff`数据坐标系为西安80的投影坐标系，在展示时配置的为`wgs84`地理坐标系，所以会有偏差。既然是坐标系问题，那就通过工具对`tiff`文件做下投影转换。这里用的是`arcmap`，打开ArcToolbox–>Data Management Tools–>Projections and Transformations–>Raster–>Project Raster

![](https://blogimage.gisarmory.xyz/202208220003.png)

转换之后会发现，数据的行列值也会发生变化，也就是`tiff`图片的大小和形状都有所变化。

转换前：

![](https://blogimage.gisarmory.xyz/202208220004.png)

转换后：

![](https://blogimage.gisarmory.xyz/202208220005.png)



使用转换后的数据再次解析，然后叠加到地图，位置完全匹配。

## 最终展示方案

通过尝试发现，单独的图片展示时，由于图片分辨率固定，当地图等级放大到一定程度图片会被放大很多导致图片模糊不清，展示效果不理想；单独的格网面展示时，当地图等级缩小到一定程度，面图层则会消失，也就是文章开头提到的问题。

综上，根据自己的格网数据大小，判断在哪个等级格网面数据会消失，小于这个等级使用图片展示，大于这个等级用格网面展示，就可以完美的展示出想要的效果。

处理前效果：

![处理前效果](https://blogimage.gisarmory.xyz/202208220001.gif)

处理后效果：

![处理后效果](https://blogimage.gisarmory.xyz/202208220002.gif)



> 以上为有`tiff`栅格数据情况的解决方案，针对于只有格网面数据，而没有`tiff`栅格数据的情况要怎么解决呢？
>
> 如果在这组格网数据中，每个网格的属性中有他所在原始`tiff`数据的像素位置，以及原始`tiff`数据像素大小，就可以写一个类似上文中的getBase64Image方法，遍历每个网格，在网格对应的像素位置上绘制颜色，然后再通过`canvas`导出图片添加到地图。



## 总结

1. `mapboxgl`的`image`图层无法直接添加tiff栅格数据
2. `mapboxgl`添加`fill`图层时，地图层级缩小到一定程度，面数据所占像素值过小无法显示
3. `tiff`数据可以使用`geotiff.js+canvas`解析，得到`base64`的图片，添加到`mapboxgl`的`image`图层
4. 在解析`tiff`数据时，需注意它的坐标系、波段个数等信息
5. 在做展示时可以`image`图层和`fill`图层结合展示，效果较好



**参考资料：**

1. https://geotiffjs.github.io/geotiff.js/
2. https://github.com/stuartmatthews/leaflet-geotiff
3. https://www.cnblogs.com/arxive/p/6746570.html



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxgl-geotiff](http://gisarmory.xyz/blog/index.html?blog=mapboxgl-geotiff)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。





