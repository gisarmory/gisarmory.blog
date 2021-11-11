# geoserver控制服务访问权限-类似百度地图的key

[TOC]



## 缘起

如题，想要用geoserver实现一个互联网地图那样的key许可功能，来控制地图服务的访问权限。

最终想要的效果就是类似下图中百度地图那样，申请个key，可以设置这个key能访问哪些地图服务资源，可以设置应用服务器ip白名单

然后把key放到地图API中，就能控制地图服务的访问权限。

![](http://blogimage.gisarmory.xyz/20211104175403.png)

![](http://blogimage.gisarmory.xyz/20211104175407.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



## 可行性分析

要使用geoserver实现上述功能，需要解决下面3个问题：

1. 如何实现key验证访问？
2. 如何控制key能访问哪些地图服务？
3. 如何实现服务器ip白名单？

### 如何实现key验证访问

geoserver发布的地图服务，默认没有进行权限控制，任何人拿到地址都可以访问地图。

我们想要的效果是，在访问geoserver服务时，需要在参数中增加一个key的参数，有这个key才能访问地图。

这个功能，geoserver是支持的

geoserver有个AuthKey的插件，支持接入外部的身份验证接口，我们可以通过自己编写外部的身份验证接口，来自己生成key、验证key，geoserver只负责转发和获取验证结果。外部接口返回的是geoserver用户名称。

然后再设置一下geoserver的拦截器，规定哪些请求必须要进行上面的验证。



### 如何控制key能访问哪些地图服务？

key的访问权限是通过geoserver用户的访问权限来设置的，前面验证key时，已经返回了用户名。

用户的权限通过角色控制，所以每次创建key时，需要同时创建用户和角色，并设置角色的访问权限。

这个环节可以使用geoserver的rest控制接口解决，使用rest控制接口可以通过程序自动完成上述配置。



### 如何实现服务器ip白名单

geoserver 作为一个服务端，它只能获取到客户端的ip，无法获取到应用服务器的ip。

如果想要获取的应用服务器的ip，就需要前端有个内应，这个内应就是js地图api，它可以在客户端的地址栏中获取到应用服务器的ip，然后传给服务端。

具体到geoserver这边，我们还是利用前面外部验证接口，在js地图Api中，把地址栏获取到的应用服务器ip和key拼一起，通过 AuthKey 的外部验证接口转发给自己的后台，后台再将ip提取出来。

地址栏ip和key的拼接，可以使用公钥、私钥模式，js地图api中使用公钥加密，后台使用私钥解密，这样可以避免明文传输ip地址。防止别人串改ip后非法访问地图。

这样就能实现对应用服务器ip的验证了。



## 流程梳理

好了，现在我们已经完成了可行性分析

接下来我们梳理一下，申请key和使用key访问地图的流程。

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



## 实施步骤

接下来详细介绍一下拦截器设置和用户权限设置。

geoserver的拦截器设置一次就行。

key、用户、角色是一一对应的，所以每次新增key时，都要去通过rest接口去新建用户和角色并设置角色的地图访问权限。

### 拦截器设置

这一步其实就是通过界面来配置geoserver的拦截器，分两步，一是配置访问哪些地址时进行拦截，也就是配置拦截规则，二是配置拦截下来后验证key是否有效，也就是配置验证规则

具体操作为先配置验证规则，再将验证规则添加拦截规则中

#### 配置key验证规则

按下图操作



![](http://blogimage.gisarmory.xyz/20211104175415.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



> 低版本geoserver可能没有authkey功能，需要去[官网](http://geoserver.org/release/maintain/)下载对应版本的`Key authentication`插件并手动安装
>
> ![](http://blogimage.gisarmory.xyz/20211104175419.png)

点击AuthKey后，会出现下图中的界面



![](http://blogimage.gisarmory.xyz/20211111095840.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

“1”那里自己随便填一个，比如就叫做`uuid_authkey`。

“2”那里选择`webservice`。这个选项的意思是，geoserver会使用外部接口验证key是否有效，到时geoserver会通过get方式将key传给外部接口，外部接口负责验证key是否有效，如果有效就返回用户名。

“3”那里配置外部接口的调用地址，geoserver调用时，会自动将`{key}`换成真实的key

其它选项保持默认就可以



我用java写了个外部接口的示意代码，来大概说明一下里面的逻辑，其实就是根据key获取geoserver用户名

![](http://blogimage.gisarmory.xyz/20211104175431.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

身份验证设置完以后点击保存按钮，它就会出现在下面的列表中。

![](http://blogimage.gisarmory.xyz/20211111095919.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



#### 配置服务拦截规则

接下来我们配置拦截规则，配置界面如下图：

![](http://blogimage.gisarmory.xyz/20211104175436.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)

我们点击最下面的 `default` 

![](http://blogimage.gisarmory.xyz/20211104175439.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



把我们刚才设置的身份验证规则添加到 `anonymous` 规则前面

> 这个列表从上到下是身份验证的先后顺序，`anonymous` 的意思是任何人可以匿名访问，如果把我们新增的规则放到了`anonymous` 的后面，就不会起作用了。

`default`里面能拦截wms和wfs请求，但不会拦截wmts和tms请求，我们需要新建一个规则，用来拦截wmts和tms请求。

wmts和tms属于瓦片缓存，归geowebcache管理，geowebcache的网络请求地址为 `gwc`,所以我们新建拦截规则时，规则设置为`/gwc/**`，然后将我们的`uuid_authkey`用户验证规则添加上，名称随便填一个，比如 `tile`，如下图：

![](http://blogimage.gisarmory.xyz/20211104175441.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



> 注意：这个页面没有保存按钮，编辑后需要返回上一个界面进行保存。

添加完成后，调整 `tile` 规则的位置，放到 `default` 上面，然后保存。

![](http://blogimage.gisarmory.xyz/20211104175444.png?imageView2/0/interlace/1/q/75|watermark/2/text/R0lT5YW15Zmo5bqT/font/5b6u6L2v6ZuF6buR/fontsize/1000/fill/IzgzODM4Mw==/dissolve/80/gravity/SouthEast/dx/10/dy/10|imageslim)



这样就实现了geoserver的key验证。



### 用户权限设置

这里直接列出需要使用的rest接口地址

| 名称             | 地址                                                         |
| ---------------- | ------------------------------------------------------------ |
| 添加角色         | http://127.0.0.1:7200/geoserver/rest/security/roles/role/{role} |
| 添加用户         | http://127.0.0.1:7200/geoserver/rest/security/usergroup/users/ |
| 用户指定角色     | http://127.0.0.1:7200/geoserver/rest/security/roles/role/{role}/user/{user} |
| 设置角色访问权限 | http://127.0.0.1:7200/geoserver/rest/security/acl/layers     |

使用rest接口时要注意两点：

1、geoserver的rest接口原则上支持xml和json格式的参数，但实际不一定，如果你用其中一种格式没有成功，这时不要吊死在一棵树上，可以换个格式试试。我就遇到了在添加用户时xml格式好使json格式不好使，但在设置权限时xml格式又不好使，json格式好使。

2、`设置角色访问权限`接口的参数和文档介绍的有所不同，这里要注意一下，正确的是下面这种：

```json
{
    "workspace.*.r": "rolename"
}
```

geoserver的rest接口说明：[https://www.osgeo.cn/geoserver-user-manual/rest/index.html#rest](https://www.osgeo.cn/geoserver-user-manual/rest/index.html#rest)

我用 Postman 导出了一份儿 java Unirest 的代码，供大家参考：[http://gisarmory.xyz/blog/index.html?source=geosreverAuthkey](http://gisarmory.xyz/blog/index.html?source=geosreverAuthkey)



## 总结

1. geoserver用户权限不仅支持对管理界面的控制，还支持对地图服务请求的控制
2. 地图服务的控制需要结合key验证的方式实现，通过配置geoserver的拦截器和验证规则，可以把key和用户关联起来
3. geoserver只支持对客户端ip的验证，想要验证应用服务器的ip，需要借助js地图api实现

<br><br>

**参考资料：**

1. https://blog.csdn.net/a571574085/article/details/115659432
2. https://blog.csdn.net/qq_38000851/article/details/113870725
3. https://www.cnblogs.com/defineconst/p/13884616.html
4. https://www.cnblogs.com/HandyLi/p/8624507.html
5. https://www.osgeo.cn/geoserver-user-manual/extensions/geofence-server/index.html
6. https://www.osgeo.cn/geoserver-user-manual/rest/index.html#rest
7. https://github.com/geoserver/geofence

<br><br>

------

原文地址：[http://gisarmory.xyz/blog/index.html?blog=geosreverAuthkey](http://gisarmory.xyz/blog/index.html?blog=geosreverAuthkey)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。