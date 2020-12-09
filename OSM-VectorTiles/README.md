

#  如何将OSM地图数据发布成矢量瓦片



[TOC]

## 1、缘起

1. 想要一个免费的矢量瓦片地图服务，目的是想要自己调整地图样式，就像[百度自定义地图](http://lbsyun.baidu.com/index.php?title=open/custom)那样的。
2. [OpenStreetMap](https://www.openstreetmap.org/)（简称OSM）可以提供免费数据，支持[下载](https://download.geofabrik.de/)，数据格式有`.osm.pbf`和`shp`。
3. OSM对数据的组织方式，是按点、线、面来的，不是我们常见的按道路、建筑物、河流来分图层的方法，但可以根据属性进行提取。
4. [openmaptiles](https://openmaptiles.org/)提供了一套完整解决方案，可以完成OSM数据的下载、入库、分析、生成矢量瓦片、调整地图样式、地图预览的全套功能，并且[开源](https://github.com/openmaptiles/openmaptiles)。
5. 接下来我们就来详细介绍`openmaptiles`开源库如何安装和快速入门。



## 2、准备环境

1. 安装linux系统（`openmaptiles`开源库只能在linux系统上运行）
2. 安装docker
3. 安装Docker Compose
4. 安装git



### 2.1、安装linux系统

1. 我是在虚拟机上安装的，虚拟机和linux系统的安装教程参考：[https://blog.csdn.net/null_of_error/article/details/108133241](https://blog.csdn.net/null_of_error/article/details/108133241)
2. 虚拟机版本我用的VM14，百度网盘下载地址：[https://pan.baidu.com/s/1BTjByB6oTz8cTxOv_GzGWw](https://pan.baidu.com/s/1BTjByB6oTz8cTxOv_GzGWw)，提取码：kshr，含许可。
3. linux系统我使用的是centOS7.9，阿里云官方镜像下载地址：[http://mirrors.aliyun.com/centos/7.9.2009/isos/x86_64/CentOS-7-x86_64-Everything-2009.iso](http://mirrors.aliyun.com/centos/7.9.2009/isos/x86_64/CentOS-7-x86_64-Everything-2009.iso)



### 2.2、安装docker

1. 安装教程参考：[https://www.runoob.com/docker/centos-docker-install.html](https://www.runoob.com/docker/centos-docker-install.html)

2. 我用的是手动安装方式，安装步骤：

   1. 安装docker

      ```
      yum install -y yum-utils device-mapper-persistent-data lvm2
      ```

   2. 设置国内阿里云的镜像源，会比官方的快

      ```
      yum-config-manager --add-repo  http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
      ```

   3. 安装Docker Engine-Community

      ```
      yum install docker-ce docker-ce-cli containerd.io
      ```

   4. 启动docker

      ```
      systemctl start docker
      ```

   5. 测试是否安装正确

      ```
      docker run hello-world
      ```



### 2.3、安装Docker Compose

1. 安装教程参考：[https://www.runoob.com/docker/docker-compose.html](https://www.runoob.com/docker/docker-compose.html)

2. 安装步骤：

   1. 安装docker compose

      ```
      curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      ```

   2.  设置权限

      ```
      chmod +x /usr/local/bin/docker-compose
      ```

   3.  测试是否安装正确

      ```
      docker-compose --version
      ```



### 2.4、安装git

1. 安装教程参考：https://www.jianshu.com/p/e6ecd86397fb

2. 安装步骤：

   1. 安装

      ```
      yum install git
      ```

   2. 测试是否安装正确

      ```
      git --version
      ```

      

## 3、发布地图

openmaptiles开源库

1. github地址：[https://github.com/openmaptiles/openmaptiles](https://github.com/openmaptiles/openmaptiles)
2. 快速入门文档：[https://github.com/openmaptiles/openmaptiles/blob/master/QUICKSTART.md](https://github.com/openmaptiles/openmaptiles/blob/master/QUICKSTART.md)

### 3.1、拉取代码

1. 拉取openmaptiles代码

   ```
   git clone https://github.com/openmaptiles/openmaptiles.git
   ```

2. 拉取完成后，进入目录

   ```
   cd openmaptiles
   ```

3.  执行make命令

   ```
   make 
   ```

### 3.2、测试网络

1. 先测试一下你电脑能不能打开这个网址：[https://www.wikidata.org/](https://www.wikidata.org/)，openmaptiles需要从这个网址下载poi数据，如果不能访问，就按下面的步骤设置，让程序跳过这一步。后续想要poi的数据的，可以自行翻墙解决。

2. 如何跳过下载poi数据：

   1. 使用vi打开quickstart.sh文件，vi使用方法参考：[https://zhuanlan.zhihu.com/p/37704677](https://zhuanlan.zhihu.com/p/37704677)

      ```
      vi quickstart.sh
      ```

   2.  找到 make import-wikidata 行
      ![](http://blogimage.gisarmory.xyz/20201209142145.png)

   3.  输入 `i` 进入插入模式

   4. 在 make import-wikidata 命令前输入#号，然后按 `esc` 键

   5. 输入`:wq` 保存退出

### 3.3、处理数据

执行下面的快速启动命令，程序会自动进行OSM数据的下载、入库、分析、生成矢量瓦片的工作。默认是阿尔巴尼亚地区，生成瓦片的层级是0-7级。后面会讲如何设置地区和层级。这个命令执行时间会稍微有些长，需耐心等待。

```
./quickstart.sh 
```

### 3.4、发布矢量瓦片服务

数据处理完成后，把生成的矢量瓦片发布成地图服务，步骤：

1. 启动服务

   ```
   make start-tileserver
   ```

2. 在自己电脑浏览器中输入虚拟机ip地址加端口8080，我电脑的地址是

   ```
   http://192.168.50.8:8080/
   ```

3. 点击 view 按钮，查看效果

   ![](http://blogimage.gisarmory.xyz/20201209142157.png)

   ![](http://blogimage.gisarmory.xyz/20201209142207.png)



### 3.5、自定义地图样式

1. 启动maputnik

   ```
   make start-maputnik
   ```

2. 在自己电脑浏览器中输入虚拟机ip地址加端口8088，我电脑的地址是

   ```
   http://192.168.50.8:8088/
   ```

   ![](http://blogimage.gisarmory.xyz/20201209142215.jpg)

3. 在刚才启动的TileServer-GL 网页中，点击下图中的TileJSON链接，然后拷贝地址

   ![](http://blogimage.gisarmory.xyz/20201209142221.png)

   ![](http://blogimage.gisarmory.xyz/20201209142227.png)

4. 回到maputnik网页，点击下图蓝框中的按钮Data Sources，把上面的地址粘贴到绿框中，再点击红框中的删除按钮，关闭其它地图。关闭弹出框，就能看到我们发布的地图了。

   ![](http://blogimage.gisarmory.xyz/20201209142231.png)

5. 接下来就可以自由奔放的自定义地图样式了
   ![](http://blogimage.gisarmory.xyz/20201209142236.png)

### 3.6、注意

1. 中国地区的地图这样写，[查看所有支持的地区](https://github.com/openmaptiles/openmaptiles/blob/master/QUICKSTART.md)

   ```
   ./quickstart.sh china 
   ```

2. 建议第一次还是先使用默认的阿尔巴尼亚地区看看效果，熟悉一下流程，因为它的数据小，处理的快。中国地区会很久，也没有个进度条，第一次测试就用这么大的，极容易失去耐心。

3. 决定数据处理时间的因素：电脑网速、电脑性能、处理数据的大小、生成瓦片的层级。

4. 我电脑的虚拟机配置比较低，处理阿尔巴尼亚地区，0-7级数据，大概用了10分钟左右，处理台湾地区数据，等了1个小时都没有完成，最后放弃了，等换个好电脑再试。

5. 想要全国地图的需要注意，中国地区和台湾地区的数据是分开的，需要分别进行下载和处理。

6. 切图等级在`.env`文件中配置



## 4、总结

1. 本文详细介绍`openmaptiles`开源库的安装和快速入门使用

2. 输入下面的帮助命令，可以查看`openmaptiles`支持的更多功能，我们后续再写文章详细介绍

   ```
   make help
   ```

   ![](http://blogimage.gisarmory.xyz/20201209142244.png)

   





* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles](http://gisarmory.xyz/blog/index.html?blog=OSMVectorTiles)

关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》公众号， 第一时间获得更多高质量GIS文章。

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。

























