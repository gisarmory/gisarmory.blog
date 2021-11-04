# geoserver控制服务访问权限-类似百度地图key验证

[TOC]



## 缘起

如题，想要用geoserver实现一个互联网地图那样的key验证，来控制地图的访问权限。

最终想要的效果就是类似百度地图那样，申请个key，可以设置这个key能访问哪些地图资源，可以设置服务器ip白名单，

然后把key放到地图API中，就能访问的指定的地图资源。

![](http://blogimage.gisarmory.xyz/20211104175403.png)

![](http://blogimage.gisarmory.xyz/20211104175407.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

## 带着问题上路

要使用geoserver实现上述功能，需要解决下面3个问题：

1. 如何实现key验证访问？
2. 如何控制key能访问哪些地图服务？
3. 如何实现服务器ip白名单？



## 如何实现key验证访问

geoserver发布的地图服务，默认没有进行权限控制，任何人拿到地址都可以访问地图。

我们想要的效果是，在访问geoserver服务时，需要在参数中增加一个key的参数，有这个key才能访问地图。

要实现这个效果，需要两步设置：第一步设置身份验证过滤器，第二步将这个过滤器加到验证链中。

### 身份验证过滤器

这一步是生成key的，有两种方式：

一种是为geoserver的每个用户生成一个uuid作为key，在访问geoserver的地图服务时需要在参数中带上这个key，geoserver会根据这个key来关联你是哪个用户，并检查这个用户有哪些地图服务访问权限。

另一种是接入自己写的外部验证接口，访问地图时，geoserver拦截到请求后，会将key转发到外部验证接口，外部接口验证后返回用户名，告诉geoserver这个key应该关联哪个用户的权限。这个过程中，生成key和验证key的逻辑需要自己来写。

这两种方式如何选择，我们先卖个关子。



**实现步骤：**

检查geoserver是否集成了authkey功能

验证方法：按下图操作，如果`New Authentication Filter`页面有`AuthKey`选项，就说明已经集成。

![](http://blogimage.gisarmory.xyz/20211104175415.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

> authkey功能在geoserver的高版本中已经内置了，不用单独安装。低版本需要手动安装插件。
>
> 我试了两个版本，2.12.1没有集成，2.19.2已经集成。

如果没有集成，则需要去[官网下载页面](http://geoserver.org/release/maintain/)下载对应版本的`Key authentication`插件，然后将插件中jar包拷贝到geoserver按照目录的geoserver\WEB-INF\lib 文件夹中，重启geoserver服务，就能在上图页面中看到`AuthKey`选项了，下图是官网下载插件的截图

![](http://blogimage.gisarmory.xyz/20211104175419.png)





安装完成后开始创建验证规则

点击AuthKey，下面的选项会随着改变



![](http://blogimage.gisarmory.xyz/20211104175422.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

`命名`那里自己随便填一个，比如就叫做`uuid_authkey`。

`Name of URL parameter`指的是geoserver请求地址中key的参数名称，如果是上图中的`authkey`，那么请求参数应该加上`&authkey=xxxxxxxxxx`。

`Authentication key to user mapper`指的是key和用户的映射关系保存在哪里，有3个选项，我们重点说一下后两个。

如果选择 `User property` 选项，geoserver会将key保存到用户信息中，点击`Synchronize user/group service`按钮，geoserver会为每个用户创建一个uuid作为key，这个key在用户页面查看

![](http://blogimage.gisarmory.xyz/20211104175425.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

如果选择`webservice`选项，geoserver中不会保存key和用户的映射关系，而是调用配置的外部接口来获取。geoserver会通过get方式将key传给外部接口，外部接口负责返回对应用户的名称。

![](http://blogimage.gisarmory.xyz/20211104175428.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

我用java写了个外部接口示意，来大概说明一下里面的逻辑，其实就是根据key获取用户名

![](http://blogimage.gisarmory.xyz/20211104175431.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

身份验证设置完以后点击保存按钮，它就会出现在下面的列表中。

![](http://blogimage.gisarmory.xyz/20211104175434.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

接下来需要把这个身份验证放到验证链中

### 验证链

验证链设置就是下面这个

![](http://blogimage.gisarmory.xyz/20211104175436.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

我们点击最下面的 `default` ，把我们刚才设置的身份验证规则放到 `anonymous` 规则前面。

![](http://blogimage.gisarmory.xyz/20211104175439.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



这个列表从上到下是身份验证的先后顺序，`anonymous` 的意思是任何人可以匿名访问，如果把我们新增的规则放到了`anonymous` 的后面，就不会起作用了。

`default`里面能拦截wms和wfs请求，但不会拦截wmts和tms请求，我们需要新建一个规则，用来拦截wmts和tms请求。

wmts和tms属于瓦片缓存，归geowebcache管理，geowebcache的网络请求地址为 `gwc`,所以我们新建拦截规则时，规则设置为`/gwc/**`，然后将我们的`uuid_authkey`用户验证规则添加上，名称随便填一个，比如 `tile`，如下图：

![](http://blogimage.gisarmory.xyz/20211104175441.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



> 注意：这个页面没有保存按钮，编辑后需要返回上一个界面进行保存。

添加完成后，调整 `tile` 规则的位置，放到 `default` 上面，然后保存。

![](http://blogimage.gisarmory.xyz/20211104175444.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



现在，我们实现了访问geoserver时进行key验证，geoserver通过key可以得知当前访问的用户名。

接下来，我们来研究，如果设置key能访问哪些地图服务



## 如何控制key能访问哪些地图服务

key的访问权限是通过用户的访问权限来设置的

用户的权限通过角色控制，所以每次创建key时，需要同时创建角色和用户。

**创建角色**

![](http://blogimage.gisarmory.xyz/20211104175453.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

**创建用户**，并设置角色为刚才添加的角色

![](http://blogimage.gisarmory.xyz/20211104175455.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



geoserver的用户权限控制分基础版和高级版

基础版只能控制到图层级别，功能已经内置在了geoserver的安装包中

高级版可以控制到服务的方法、图层内部数据的范围、客户端ip限制等，功能需要额外安装插件才能有。

这两个版本如何选择，需要根据自己的实际情况来，因为我只需要控制到工作空间基本，所以就使用了基础版。

### 基础版访问权限设置

基础版地图访问权限设置，可以通过角色控制工作空间、图层组和图层的读、写、管理权限。

设置方法如下图：

![](http://blogimage.gisarmory.xyz/20211104175458.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

也可以在工作区、图层组、图层的详情界面设置，设置后上面的 `Data Security` 会同步添加数据

设置步骤如下图：

![](http://blogimage.gisarmory.xyz/20211104175500.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



### 高级版访问权限控制

如果觉得基础版不能满足要求，比如想只允许wms访问，这时就需要用到 geoserver 的高级权限控制工具`geofence`，

`geofence`需要去[geoserver官网下载](http://geoserver.org/release/maintain/)对应版本的插件然后安装，下图是需要下载的插件截图，具体安装步骤这里就不再赘述了。

![](http://blogimage.gisarmory.xyz/20211104175503.png)

安装成功后，geoserver左侧出现 GeoFence 的相关菜单

![](http://blogimage.gisarmory.xyz/20211104175505.png)

> 注意：下载时只需要下载server端插件，如果同时下载和安装Client端和Server端插件，访问geofence页面时geoserver会报下面的错误
>
> ![](http://blogimage.gisarmory.xyz/20211104175508.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



geofence有3个功能菜单，`GeoFence`是客户端负责监控和统计访问数据，`GeoFence Data Rules`负责设置wms、wfs等服务访问权限，`GeoFence Admin Rules`负责设置geoserver管理页面访问权限。

这里说一下服务访问权限的设置，设置步骤如下图

![](http://blogimage.gisarmory.xyz/20211104175510.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



里面的大部分选项都很容易理解，这里我们重点说一下 ip设置，这也是我们最关心的。

这里的ip设置控制的是客户端的ip，而不是像百度地图那样，控制的应用服务器的ip地址。

这一点有点让人失望，因为我们想要控制的是应用服务ip地址。

想想也是，geoserver作为一个服务端，获取客户端的ip是可以理解的，如果要求它获取客户端浏览器地址栏的域名似乎就有点过分了。



到这里，我们已经把角色和地图服务权限关联起来了

现在访问wms、wmts、wfs、tms服务都必须要添加key才能够正常访问。

> 注意：在同一浏览器窗口下，geoserver登录时，有没有key都能正常访问，要退出geoserver或换个浏览器才能测试出来key是否好用

geoserver的预览界面在未登录的情况下，已经不再显示受保护的地图资源了。

![](http://blogimage.gisarmory.xyz/20211104175513.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

### 自动化配置

还有个问题需要解决，这里key、用户、角色、地图权限是一一对应的，每次申请key时，这些都需要通过程序自动完成，而不能手工设置。

这个问题可以使用geoserver的rest控制接口解决，使用rest控制接口可以通过程序自动完成上述配置。

使用rest接口时有两点要注意：

1. 使用基础版管理权限和使用高级版管理权限的rest接口不一样的。
2. geoserver的rest接口原则上支持xml和json格式的参数，但实际不一定，如果你用其中一种格式没有成功，这时不要吊死在一棵树上，可以换个格式试试。我就遇到了在添加用户时xml格式好使json格式不好使，但在设置权限时xml格式又不好使，json格式好使。

这里列一下基础版管理方式的几个rest接口地址，节省你的查找时间

| 名称             | 地址                                                         |
| ---------------- | ------------------------------------------------------------ |
| 添加角色         | http://127.0.0.1:7200/geoserver/rest/security/roles/role/{role} |
| 添加用户         | http://127.0.0.1:7200/geoserver/rest/security/usergroup/users/ |
| 用户指定角色     | http://127.0.0.1:7200/geoserver/rest/security/roles/role/{role}/user/{user} |
| 设置角色访问权限 | http://127.0.0.1:7200/geoserver/rest/security/acl/layers     |

设置`角色访问权限`接口的参数和文档介绍的有所不同，这里要注意一下，正确的是下面这种：

```json
{
    "workspace.*.r": "rolename"
}
```

geoserver的rest接口说明：https://www.osgeo.cn/geoserver-user-manual/rest/index.html#rest

接下来还有最后一个要解决的问题：如何设置应用服务器ip白名单？

## 如何实现服务器ip白名单

前面提到，geoserver 作为一个服务端，让它获取客户端浏览器地址栏ip，有点难为它，但如果客户端能有个内应，这事儿就好办多了，

这个内应就是js地图api，可以在js地图api中获取客户端浏览器地址栏ip，然后传给服务端。

具体到geoserver这边，我们可以利用前面 AuthKey 的 web service接口，在js地图Api中，把地址栏获取到的应用服务器ip和key拼一起，通过 AuthKey 的 web service 接口转发给自己的后台，后台再将ip提取出来。

> 前面卖的关子，在这里真相大白了，如果想控制应用服务器ip，就必须使用web service接口
>
> 如果只是为了对geoserver服务做个简单的限制，则可以使用给用户生成uuid的方式

地址栏ip和key的拼接，可以使用公钥、私钥加密模式，js地图api中使用公钥加密，后台使用私钥解密，这样可以避免明文传输ip地址。防止别人串改ip后非法访问地图。

这样就能实现对应用服务器ip的验证了。



## 流程梳理

好了，现在我们已经完成了可行性分析

接下来让我们梳理一下，在申请key，和使用key访问地图的流程

### 申请key

1. 在申请地图key的页面，输入应用名称、应用部署的服务器ip、勾选需要的地图服务，然后生成个key
2. 调用geoserver的rest控制接口，创建角色、用户、设置角色可以访问的地图服务
3. 将key、应用服务器ip和geoserver用户进行关联并保存到数据库

### 访问地图

1. 开发地图应用时，把申请到的key传入自己写的js地图api
2. js地图api内部获取浏览器地址栏ip，这个ip就是应用服务器ip，将ip和key使用公钥加密，生成newkey，并在请求geoserver服务时将newkey作为参数传给geoserver
3. geoserver的拦截器拦截到请求后，将newkey提取出来，转发给我们自己写的权限验证接口
4. 权限验证接口接收到newkey后，使用私钥解密，就能获取到key和应用服务器ip，然后去数据库比对是否有符合这两个条件的数据，如果有就返回对应的geoserver用户名
5. geoserver拦截器接收到验证接口返回的用户名后，查询该用户拥有的角色，再比对角色的权限中是否有本次请求的地图服务。有就返回数据，没有就打回。

这样一整套流程下来，就实现了用geoserver，实现类似互联网地图那样的key验证方式来控制地图的访问权限



## 总结

1. geoserver用户权限不仅支持对管理界面的控制，还支持对地图服务请求的控制
2. geosrver支持key验证访问
3. geoserver支持将key和用户关联，实现通过key控制地图服务权限的目的
4. geoserver支持对客户端ip的限制，但不支持对应用服务器ip的限制，后者需要配合地图api实现



**参考资料：**

1. https://blog.csdn.net/a571574085/article/details/115659432
2. https://blog.csdn.net/qq_38000851/article/details/113870725
3. https://www.cnblogs.com/defineconst/p/13884616.html
4. https://www.cnblogs.com/HandyLi/p/8624507.html
5. https://www.osgeo.cn/geoserver-user-manual/extensions/geofence-server/index.html
6. https://www.osgeo.cn/geoserver-user-manual/rest/index.html#rest
7. https://github.com/geoserver/geofence



------

原文地址：[http://gisarmory.xyz/blog/index.html?blog=geosreverAuthkey](http://gisarmory.xyz/blog/index.html?blog=geosreverAuthkey)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。