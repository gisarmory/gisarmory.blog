# mapboxgl 类高德带箭头轨迹线
最近在使用mapboxgl实现轨迹展示时，想实现类似高德地图导航轨迹效果，经一番查找与尝试，参考`leaflet.polylineDecorator`扩展核算法，最终实现如下效果。

效果如下：

![2020122506](https://blogimage.gisarmory.xyz/2020122506.gif)



核心代码如下：

![202012280101](F:\myself\gisarmory\Leaflet.PolylineDecorator\202012280101.png)

**注意：**

1. **通过`polylineDecorator`计算出的角度针对的是箭头朝向为上的图标，我用的箭头朝向是右侧，就需要在原角度的基础上`-90`；**
2. **`polylineDecorator`计算的角度未考虑地图旋转，所以需要在原角度基础上加上地图旋转方向`map.getBearing()`**

详细代码通过在线示例`F12`即可查看。

## 在线示例

[在线示例](
http://gisarmory.xyz/blog/index.html?demo=LeafletPolylineDecorator)



## 参考内容

https://github.com/bbecquet/Leaflet.PolylineDecorator

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator](http://gisarmory.xyz/blog/index.html?blog=MapboxGLPolylineDecorator)。



关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。


