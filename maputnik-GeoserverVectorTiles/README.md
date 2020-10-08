如何让mapboxgl矢量地图配图神器maputnik支持 geoserver

关键词：maputnik、geoserver、mapboxgl、mapbox、矢量地图、地图配图、地图配色



先说说maputnik是啥
官方解释：Maputnik是Mapbox样式规范的开源可视化编辑器。通俗点讲，就是百度地图的个性化地图编辑器是一个东东。
mk的出现主要是为了搞一份儿开源的 mapbox stio 。
作者开发它的目的为了和OSM，打造一套对标 mapbox 的开源GIS体系，

Maputnik 目前的1.7版本加载geoserver发布的矢量瓦片时有问题，不能正确显示。



一直想搞一个类似百度、高德地图那样的专题图配图工具，

（图）

在网上找过几次，都没有找到。

无意中从这个[博客]( https://blog.csdn.net/wclwksn2019/article/details/105572485)了解到了Maputnik，看到的第一眼就感觉相见恨晚，对！就是我要找的东西。

> Maputnik github地址：https://github.com/maputnik/editor
>
> maputnik 官网：https://maputnik.github.io/
>
> 这个[地址]( https://www.kickstarter.com/projects/174808720/maputnik-visual-map-editor-for-mapbox-gl)可以了解到更多Maputnik的创建背景，和关联工具。



平时工作中已经习惯了使用geoserver发布地图服务。看到网上有很多文章介绍如何用geoserver发布矢量瓦片，用mapboxgl来渲染显示。比如[这篇](https://blog.csdn.net/qq_34870529/article/details/92768540)（这是mapbox的）。

自己尝试了一下，确实可以。

（代码图）

（效果图）



于是，准备用maputnik来加载上面geoserver发布的矢量瓦片服务，来配置样式，用mapboxgl进行前端展示

发现mtk加载geoserver发布的地图不显示

排查问题

发现中国的地图都跑到了南半球，在南半球还不好好显示

使用mapboxgl直接调用geoserver发布的矢量瓦片可以正确显示

于是研究mapbogl的api发现，source的属性中（模式）属性支持xyz和tms，默认是xyz。
xyz简介
tms简介
更多关于介绍参见这篇博客内容

会不会是mtk只支持xyz不支持tms呢，在mapboxgl测试一下，发现和在mtk中出现的问题一样。哈哈
geoserver是否支持发布xyz格式的矢量瓦片呢，找一圈没找到
那能不能让maputnik支持tms呢，这个应该可以，mtk是对mapboxgl数据源和样式的配置器，mapboxgl既然支持，mtk坑定也可以支持
看mtk源码，添加xyz矢量瓦片数据源的代码是在这里写的，给这里加个选择xyz和tms的选项的下拉框应该就可以
说干就干，在这里家下拉框
在这里加默认值
再试试
成功了，哈哈
总结：Maputnik是配置mapboxgl格式矢量瓦片样式的工具Maputnik默认只支持xyz格式，不支持tmsgeoserver只支持发布tms格式矢量瓦片修改Maputnik源码，增加模式选项，就可以支持tms格式矢量瓦片

源码：支持geoserver矢量瓦片的maputik源码









参考：https://www.kickstarter.com/projects/174808720/maputnik-visual-map-editor-for-mapbox-gl/description