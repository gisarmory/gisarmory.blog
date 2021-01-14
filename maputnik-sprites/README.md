# 如何创建 mapbox 精灵图



## 缘起

前面文章介绍了[如何在本地发布OSM数据](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)，并使用 maputnik 自定义 mapbox 格式的地图样式。在使用 maputnik 配图时，如果想要使用自己的图片作为地图符号，就需要制作精灵图。

精灵图的制作工具有很多，在线网站就有一大堆，但普遍存在一个问题，maputnik 对精灵图的要求是要有精灵图和说明精灵图中图片信息的json配置文件，而这些在线网站的工具，只能生成精灵图，没有json配置文件。



## mapbox精灵图工具

mapbox开源了一个精灵图制作工具 [spritezero](https://github.com/mapbox/spritezero)，这个工具可以生成精灵图和对应的json文件。spritezero 的输入文件是svg文件，输出文件是指定比例的精灵图和对应的json文件。

我自己在安装 spritezero 这个工具时总报错，翻看它的 issues 发现很多人都碰到了这个[问题](https://github.com/mapbox/spritezero/issues/84)。原因是用到的一个类库太老了，我最终解决办法是另辟蹊径，找了一个它的docker库 [spritezero-docker](https://github.com/macteo/spritezero-docker) ， 这个docker库里已经把 spritezero 的环境配置好了，直接用就行。



## spritezero-docker 使用方法

下面的操作步骤是基于linux系统

1. 克隆库 

    ```
    docker pull dolomate/spritezero
    ```

2. 在当前目录创建 `./data/sprites/_svg`  文件夹

3. 把svg文件放在 `./data/sprites/_svg` 文件夹中，svg文件的名称不要太随意，名称会被写入json配置文件，后续使用时会用到。
    ![](http://blogimage.gisarmory.xyz/20210114121214.png)

4. 在当前目录执行命令，生成精灵图：

    ```
    docker run -it -e FOLDER=_svg -e THEME=sprites -v ${PWD}/data:/data dolomate/spritezero
    ```

5. 生成的精灵图会存放在 `./data/sprites` 文件夹中



## 精灵图黑框问题

查看生成的精灵图，你可能会碰上下图中的问题：只有黑色轮廓
![](http://blogimage.gisarmory.xyz/20210106175424.png)

一通排查，发现上面问题的原因是：在svg代码中，style的写法问题。style单独写不行，需要内嵌到dom元素中，如下图：

![](http://blogimage.gisarmory.xyz/20210106175429.png)

![](http://blogimage.gisarmory.xyz/20210106175432.png)



解决方法，用 AI（Adobe Illustrator） 软件导出SVG文件时，CSS属性栏选择“样式属性”，style就会内嵌到dom元素中了。下图是导出时的正确选项，更深入的可以参考[这篇文章](https://cloud.tencent.com/developer/article/1007666)

![](http://blogimage.gisarmory.xyz/20210106175435.png)



## 在 maputnik 中使用生成的精灵图

1. 把生成的精灵图用web服务器发布出来，我用的tomcat。记得解决web服务器的跨域问题，不然调用时会报错。

2. 配置精灵图发布的路径，如下图

  ![](http://blogimage.gisarmory.xyz/20210106175442.png)

3. 选择一个symbol类型的符号，在 Image 选项的下拉框中，会直接显示精灵图中的图片名称，这个图片名称就是前面让大家起名不要太随意的SVG文件名称。

   ![](http://blogimage.gisarmory.xyz/20210106175445.png)



## 总结：

1. 在用 maputnik 配图时，如果想自定义地图符号，就要自己制作精灵图
2. 网上的精灵图制作工具，普遍只能生成精灵图，没有json配置文件，而 maputnik 需要json配置文件
3. mapbox开源了一个精灵图制作工具 spritezero ，生成的精灵图有json配置文件
4. spritezero 在安装时会报错，原因是用到的一个库太老了
5. spritezero-docker 是spritezero的docker库，已经解决了安装环境问题
6. 介绍了如何使用 spritezero-docker 生成精灵图
7. 生成精灵图时，如果出现黑框问题，多半是因为style的写法问题。style需要内嵌到dom元素中
8. 介绍了如何在 maputnik 中使用生成的精灵图



## 相关连接：

1. *如何在本地发布OSM数据：[http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)*
2. *spritezero库github地址：[https://github.com/mapbox/spritezero](https://github.com/mapbox/spritezero)*
3. *spritezero库安装报错的问题：[https://github.com/mapbox/spritezero/issues/84](https://github.com/mapbox/spritezero/issues/84)*
4. *spritezero-docker库github地址：[https://github.com/macteo/spritezero-docker](https://github.com/macteo/spritezero-docker)*
5. *如何正确用AI导出SVG文件：[https://cloud.tencent.com/developer/article/1007666](https://cloud.tencent.com/developer/article/1007666)*



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=maputnikSprites](http://gisarmory.xyz/blog/index.html?blog=maputnikSprites)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。