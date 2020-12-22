# OSM地图本地发布（二）- 自定义切图



[TOC]

## 1、缘起

1. `openmaptiles`提供了一套OSM数据使用的完整解决方案，在前面文章[如何实现OSM地图本地发布并自定义配图](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)中，我们详细介绍了如何安装`openmaptiles`，并生成了一个阿尔巴尼亚地区的“helloworld”。

2. 参照上篇文章的内容，输入下面的命令，就可以生成中国地图。

   ```
   ./quickstart.sh china 
   ```

3. 上面命令，需要耐心等待，我电脑4核8G，用了16个小时左右。最终得到了中国大陆地区，0-7级的矢量瓦片数据。

4. `openmaptiles`主要是从[geofabrik](https://download.geofabrik.de/)网站下载OSM数据，geofabrik在中国地区下载的最小颗粒度是中国大陆和台湾，没有办法按大陆地区的省，或按自定义区域进行下载。



## 2、问题

1. 能不能按自定义区域生成地图？
2. 有哪些方法能提高处理速度？



## 3、分析

1. `openmaptiles`生成地图分4个步骤：1、数据下载、2、数据入库、3、数据分析、4、生成矢量瓦片。
2. 问题一分析：
   1. 前三个步骤，只能按整个中国的范围和所有层级来处理，第4步可以通过控制范围、层级来实现自定义区域的切图。
3. 问题二分析：
   1. 第1步数据下载的时间取决于网速。
   2. 第2步数据入库和第3步数据分析的时间取决于机器性能。
   3. 第4步生成矢量瓦片的时间取决于机器性能、切图范围、切图层级。
   4. 想要提高处理速度，可以针对上面的要素，对症下药。



## 4、生成自定义地区矢量瓦片

1. 前面的`./quickstart.sh china `命令包含1-4步，**后续就不要再执行这个命令了**，不然又得重来16个小时。前面已经提到过，这个命令在第4步，默认会切整个中国范围0-7级的地图。想要更大层级的地图，只需要另外单独执行第4步就可以。
2. `openmaptiles`生成的矢量瓦片，最大到14级，设置再大也没有用，因为前三步没有对更大级别的数据进行分析。
3. 第4步`生成矢量瓦片`的命令，会把上一次的瓦片清除，如果想把两次的结果放在一个文件中，比如想把中国0-7级和北京8-14级的矢量瓦片放在一个.mbtiles文件中，则需要修改配置，让程序不清除上一次的结果。
4. 下面以生成全国范围0-7级地图+北京范围8-14级地图为例，说明如何来修改配置。
5. 为避免重启电脑后就各种不灵的尴尬，我们从重启电脑后开始。

### 4.1、启动docker

1. 检查docker是否启动

   ```
   docker --version
   ```

2. 如果没有启动，输入下面命令启动docker。如果有需要，后续可以自己把docker设置为开机自启动。

   ```
   systemctl start docker
   ```

### 4.2、启动postGIS容器

1. 前面的`./quickstart.sh china `命令在执行过程中，下载了4个docker镜像，启动了若干个容器，工具类容器在使用完成后就销毁了，数据类和应用类的容器会保留。（[镜像和容器的关系](https://blog.csdn.net/qq_40722827/article/details/102827125)）

2. 下图红框中的容器就是存放数据的，它里面有个postGIS，我们需要启动这个容器。
   ![image-20201219164614135](C:\Users\HERO\AppData\Local\Temp\image-20201219164614135.png)

3. 进入`openmaptiles`文件夹

4. 启动postGIS容器

   ```
   make start-db-preloaded
   ```

### 4.3、设置不清理上次的结果

1. 打开`Makefile`文件，找到generate-tiles命令，下图红框的位置，就是清除上次结果文件的命令，我们在这行前面输入`#`号，把它注释掉。
   ![](http://blogimage.gisarmory.xyz/20201221130844.png)

### 4.4、删除默认切图范围

1. 程序默认会用china.bbox中的参数作为切图范围，我们把这个文件删掉，后续在.env文件中配置。

2. china.bbox文件在`data`文件夹中，删除命令：

   ```
   rm -f ./data/china.bbox
   ```

### 4.5、修改切图层级和范围

1. 打开.env文件
2. 修改切图的层级`MIN_ZOOM`和`MAX_ZOOM`
   ![](http://blogimage.gisarmory.xyz/20201221130854.png)
3. 修改切图的范围`BBOX`，格式为：minX,minY,maxX,maxY
   ![](http://blogimage.gisarmory.xyz/20201221130905.png)

### 4.6、生成瓦片

1. 输入下面命令，生成瓦片

   ```
   make generate-tiles
   ```

2. 生成的结果是`tiles.mbtiles`文件，在`data`文件夹中

### 4.7、重复操作

1. 重复4.5和4.6步骤，修改层级和范围，就能把多次的结果放在一个文件中。



## 5、总结

1. `openmaptiles`生成地图分4个步骤：1、数据下载、2、数据入库、3、数据分析、4、生成矢量瓦片。
2. 中国地区生成地图的最小颗粒度是中国大陆和台湾，没有办法按大陆地区的省或按自定义区域进行生成。
3. 前三个步骤，只能按整个中国的范围来处理，第4步可以通过控制生成范围、生成层级来实现生成自定义区域的地图。
4. 前三个步骤只需要执行一次，最后一个步骤可以多次执行。
5. 如果想把多次生成的矢量瓦片放在一个文件中，可以设置不清除上次生成的结果。



* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=OSMOpenmaptiles](http://gisarmory.xyz/blog/index.html?blog=OSMOpenmaptiles)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。