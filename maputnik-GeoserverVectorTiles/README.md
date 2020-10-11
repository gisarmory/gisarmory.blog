# 如何让矢量瓦片配图神器maputnik支持 geoserver

关键词：maputnik、geoserver、矢量地图、矢量瓦片、mapbox、mapboxgl、地图配图、地图配色

------



一直想搞一个类似百度、高德地图那样的矢量地图配图工具

百度个性化地图配图工具：

![image-20201011155118734](http://blogimage.gisarmory.xyz/20201012072247.png)

高德自定义地图配图工具：

![image-20201011155314884](http://blogimage.gisarmory.xyz/20201012072243.png)

在网上找过几次，都没有找到。

无意中从这个[博客]( https://blog.csdn.net/wclwksn2019/article/details/105572485)了解到了Maputnik，一阵摆弄后，感觉相见恨晚。对！就是我要找的东西。

![image-20201011155711758](http://blogimage.gisarmory.xyz/20201012072239.png)



## Maputnik是啥？有啥用？

Maputnik是Mapbox样式规范的开源可视化编辑器，它和Mapbox的mapbox studio、百度地图的个性化地图编辑器、高德地图的自定义地图编辑器干的是一个事，都是用来编辑矢量瓦片地图样式，配图用的。

有了Maputnik就可以这样来发布地图，

1. 用geoserver发布矢量瓦片
2. 用Maputnik为上面的矢量瓦片配置地图样式
3. 用openlayers、leaflet或mapbox调用矢量瓦片，并应用上面的地图样式，在前台渲染地图展示

和 mapbox studio 相比，Maputnik开源，可以免费在本地使用，不再需要把自己的地图数据上传到mapbox的服务器，相应的也就不用受制于mapbox免费账号对每月上传数据量的限制，和对地图调用次数的限制。

> maputnik 官网：https://maputnik.github.io/
>
> Maputnik github地址：https://github.com/maputnik/editor
>
> Maputnik 官方在线体验地址：https://maputnik.github.io/editor/
>
> Maputnik的创建[背景](https://www.kickstarter.com/projects/174808720/maputnik-visual-map-editor-for-mapbox-gl)，作者是想打造一套对标 mapbox 的开源GIS解决方案。



## 遇到的问题

用Maputnik1.7.0版本加载geoserver发布的矢量瓦片时遇到一个问题，加载的图层不显示，这个问题困扰了自己好几天，去网上百度、谷歌，相关的资料也非常少，没有答案。

自己好不容易遇到的兵器，难道就要这样擦肩而过吗？不，我不允许！

功夫不负有心人，经过几天的折腾，终于让我发现了其中的问题，下面详细说一下。



## 排查问题

发现地图没显示，就习惯性的打开了浏览器的开发者工具，发现缩放、拖动地图时，浏览器去请求了瓦片，但都没有成功。

![image-20201011164559961](http://blogimage.gisarmory.xyz/20201012072233.png)

拷贝其中一个请求地址，在浏览器单独打开，看到geoserver返回的报错提示是，请求的瓦片超出了数据范围。

![image-20201011164714033](http://blogimage.gisarmory.xyz/20201012072229.png)

Maputnik地图的api使用的是mapboxgl，那直接用mapboxgl调用一下发布的矢量瓦片，或许能更容易排查问题。网上介绍mapboxgl调用geoserver矢量瓦片的文章还是挺多的，自己参考着写了个示例。运行示例，结果瓦片可以正确请求到并显示。

代码：

``` js
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/light-v10',
		zoom: 3,
		center: [108.34942054748535,37.83543237333567]
	});

	map.on('load', function() {
		map.addLayer({
			"id": "mapillary",
			"type": "line",
			"source": {
				"type": "vector",
				'scheme':'tms',
				"tiles": ["http://192.168.50.198:7000/geoserver/gwc/service/tms/1.0.0/china%3Acity_region@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf"],
			},
			"source-layer": "city_region",
			"paint": {
				"line-opacity": 0.6,
				"line-color": "rgb(53, 175, 109)",
				"line-width": 2
			}
		}, 'waterway-label');
	});
```

效果：

![image-20201011165013883](http://blogimage.gisarmory.xyz/20201012072222.png)

这就有点意思了，看来还是Maputnik的调用配置出现了问题。打开浏览器开发者工具，发现示例请求的瓦片地址中的编号，要比maputnik中的编号大很多。

![image-20201011170332981](http://blogimage.gisarmory.xyz/20201012072218.png)

![image-20201011170409587](http://blogimage.gisarmory.xyz/20201012072213.png)

在maputnik中拖动地图。找到和示例中相同的瓦片编号，发现地图跑到了南半球。

![image-20201011170639987](http://blogimage.gisarmory.xyz/20201012072208.png)

这会是什么原因造成的呢，会不会是请求瓦片的大小不同，比如一个是256x256的，一个是512x512的，通常这种情况也会导致出现上面的问题，而且编号会刚好相差一半。

但现在的编号差的好像并不是一半，那geoserver发布的矢量瓦片到底是多少呢？Maputnik中又是按照什么规则来请求的呢？抱着这个疑问，我决定去研究一下mapboxgl的api，看会不会有什么发现。

上面示例的代码中，数据源是通过source来配置的

~~~ js
	"source": {
				"type": "vector",
				'scheme':'tms',
				"tiles": ["http://192.168.50.198:7000/geoserver/gwc/service/tms/1.0.0/china%3Acity_region@EPSG%3A900913@pbf/{z}/{x}/{y}.pbf"],
			},
~~~

这里面有三个参数，`type`和`tiles`的意思好理解，`scheme`是什么意思呢？

查看mapboxgl的api，关于[scheme](http://www.mapbox.cn/mapbox-gl-js/style-spec/#sources-vector-scheme)的解释如下：

![image-20201011142510634](C:\Users\xiaolei\AppData\Roaming\Typora\typora-user-images\image-20201011142510634.png)

这个 `xyz`和`tms`分别是啥意思呢？

百度后觉得这篇[博客](https://www.cnblogs.com/d1012181765/p/13631169.html)写的还算明白，它们是两种请求瓦片的协议，不同协议对瓦片编号的规则也不同，在`xyz`协议中，Y从顶部开始计算，而在`tms`协议中，Y从底部开始计算。mapboxgl默认使用`xyz`协议，而geoserver发布的是`tms`协议。所以调用时需要定义`scheme`为`tms`。

问题找到这里，感觉自己已经看到黎明的曙光了。

那如果把示例中的`scheme`设置为`xyz`会不会出现和Maputnik一样的错误呢？尝试后答案是肯定的，地图同样跑到了南半球。

![image-20201011173212261](http://blogimage.gisarmory.xyz/20201012072159.png)

真相大白了，Maputnik界面上因为没有配置`scheme`的选项，而`scheme`默认是`xyz`协议，所以就导致它只支持`xyz`协议，不支持`tms`协议，所以就请求不到瓦片，地图无法正确显示。



## 如何解决

问题找到了，接下来就是如何解决，思路有二：

1. geoserver发布一个`xyz`协议的矢量瓦片服务。
2. 修改一下Maputnik的源码，增加`scheme`的选项，让它支持`tms`协议。

思路一自己找了一圈，没有发现相关教程，个人感觉思路二更简单一些，只要在下图的红框的位置加个选择`scheme`的下拉框就能解决问题

![image-20201011173847958](http://blogimage.gisarmory.xyz/20201012072151.png)

下载maputnik的源码，一通研究，发现修改下面两个位置就可以：

1、在这里加一个下拉框控件

![image-20201011174911575](http://blogimage.gisarmory.xyz/20201012072145.png)

2、在这里给`scheme`设置一下默认值

![image-20201011175014061](http://blogimage.gisarmory.xyz/20201012072140.png)

ok，来，走两步

一步

![image-20201011175322458](http://blogimage.gisarmory.xyz/20201012072135.png)

两步

![image-20201011180144760](http://blogimage.gisarmory.xyz/20201012072120.png)

哈哈，效果杠杠的！问题完美解决。



## 总结

1. Maputnik是一个矢量瓦片配图工具，可以替代 mapbox studio，免费使用。

2. Maputnik默认只支持xyz协议的矢量瓦片，不支持geoserver发布的tms协议矢量瓦片。

3. Maputnik的地图api使用的是mapboxgl，mapboxgl通过设置source的scheme选项，可以支持tms协议。

4. 通过修改Maputnik源码，增加scheme选项，就可以让Maputnik支持geoserver发布的tms协议矢量瓦片。

   

## 源码

[支持tms矢量瓦片的maputik源码](http://gisarmory.xyz/blog/index.html?source=maputnikGeoserverVectorTiles)



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles](http://gisarmory.xyz/blog/index.html?blog=maputnikGeoserverVectorTiles)

关注[GIS兵器库公众号](http://gisarmory.xyz/blog/index.html?blog=wechat)， 获得更多高质量GIS文章更新。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。















