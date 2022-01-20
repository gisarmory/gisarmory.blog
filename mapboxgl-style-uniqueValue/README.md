# mapboxgl 地图样式 - 唯一值渲染

mapboxgl 中提供了强大的地图样式编辑功能，样式表达式是其一大特色。

唯一值渲染是GIS中常见的专题图渲染方式，今天我们来看一下如何用 mapboxgl 中的样式表达式实现这一效果。

在网上找了一份北京市的行政区划图，目标是各个区设置上不同的颜色。效果如下：

![](http://blogimage.gisarmory.xyz/20220120162649.png)





## 方式一：使用 case 表达式

这种做法的好处是可以灵活修改每个区的颜色。

```js
"fill-color":[
    'case',
    ['boolean',['==',['get','name'],'怀柔区'],false],'#FFFFCC',
    ['boolean',['==',['get','name'],'密云区'],false],'#CCFFFF',
    ['boolean',['==',['get','name'],'平谷区'],false],'#FFCCCC',
    ['boolean',['==',['get','name'],'通州区'],false],'#FFFF99',
    ['boolean',['==',['get','name'],'房山区'],false],'#CCCCFF',
    ['boolean',['==',['get','name'],'延庆区'],false],'#FFCC99',
    ['boolean',['==',['get','name'],'门头沟区'],false],'#CCFF99',
    ['boolean',['==',['get','name'],'大兴区'],false],'#66CCFF',
    ['boolean',['==',['get','name'],'顺义区'],false],'#99CCFF',
    ['boolean',['==',['get','name'],'海淀区'],false],'#CCCCCC',
    ['boolean',['==',['get','name'],'西城区'],false],'#CCFFCC',
    ['boolean',['==',['get','name'],'东城区'],false],'#CC99CC',
    ['boolean',['==',['get','name'],'朝阳区'],false],'#99CC99',
    ['boolean',['==',['get','name'],'石景山区'],false],'#CCCC99',
    ['boolean',['==',['get','name'],'昌平区'],false],'#FF9969',
    ['boolean',['==',['get','name'],'丰台区'],false],'#999999',
    'black'
]
```

上面表达式的意思是，从数据中获取 name 属性的值，判断是哪个区，然后设置相应的颜色。

case表达式语法，详见[官方说明](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#case)

> mapboxgl 表达式的基本语法：
>
> 1、一组中括号[ ]代表一个完整的表达式，中括号中第一个参数声明表达式的类型，后面是表达式的参数。
>
> 2、表达式可以嵌套。
>
> 关于表达式的详细介绍，后续会用单独一篇文章来写，这里只做个简单说明。

上面这段表达式如果翻译成 js 大致是这样的：

```js
function getColor(feature){	//feature是geojosn格式中的Feature
    if(feature.properties.name === '怀柔区'){		
        return '#FFFFCC'
	}
	else if(features[i].name === '密云区'){	
        return '#CCFFFF'
	}
    ...
    else{
        return 'black'
    }
}
```

[在线示例](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleUniqueValue1)，浏览器 F12 可以查看完整代码。



## 方式二：使用 match 表达式

match 和 case 类似，但在写法上更为简洁

```js
"fill-color":[
    'match',
    ['get','name'],
    '怀柔区','#FFFFCC',
    '密云区','#CCFFFF',
    '平谷区','#FFCCCC',
    '通州区','#FFFF99',
    '房山区','#CCCCFF',
    '延庆区','#FFCC99',
    '门头沟区','#CCFF99',
    '大兴区','#66CCFF',
    '顺义区','#99CCFF',
    '海淀区','#CCCCCC',
    '西城区','#CCFFCC',
    '东城区','#CC99CC',
    '朝阳区','#99CC99',
    '石景山区','#CCCC99',
    '昌平区','#FF9969',
    '丰台区','#999999',
    'black'
]
```

翻译成js是下面这样：

```js
function getColor(feature){	//feature是geojosn格式的Feature
    switch(feature.properties.name){		//['get','name']
        case '怀柔区':
        	return '#FFFFCC'
        case '密云区':
        	return '#CCFFFF'
        ...
        default
        	return 'black'
    }
}
```

[在线示例](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleUniqueValue2)



## 方式三：根据 id 匹配颜色

前两种表达式适合数据量较小时使用。当数据量较大时，可以通过设置一组颜色，根据数据中的某个id字段进行匹配来实现。

```js
"fill-color":['to-color',['at',['%', ['get', 'adcode'], 13],['literal','#00FFCC','#CCFFFF','#FFCCCC','#FFFF99','#CCCCFF','#FFCC99','#CCFF99','#66CCFF','#99CCFF','#CCFFCC','#99CC99','#CCCC99','#FF9969']]]]
```

上面表达式的意思是，会用数据中 adcode 的属性值除以13然后取余数，根据余数从颜色数组中取一个颜色。

表达式详细说明：

1. `['get', 'adcode']` 表达式`get` 从数据中获取 `adcode` 属性的值。
2. `['%', ['get', 'adcode'], 13]` 表达式`%`将 `adcode` 的值除以13并取余数，这里的13代表颜色数组的个数。
3. `['literal','#00FFCC',...]` 表达式 `literal` 用来声明一个颜色数组，因为在这里中括号被默认是表达式，所以想要定义真正的数组就要用  `literal`  声明一下。
4. `['at',['%', ['get', 'adcode'], 13],['literal','#00FFCC',...]]` 表达式 `at` 是根据求余的值从颜色数组中取颜色。
5. `['to-color', ['at',['%', ['get', 'adcode'], 13],['literal','#00FFCC',...]]]` 表达式 `to-color` 是将字符串转为mapboxgl 的颜色类型，不然会报错。

翻译成js是下面这样：

```js
function getColor(feature){	//feature是geojosn格式的Feature
    const colors = ['#00FFCC','#CCFFFF','#FFCCCC','#FFFF99','#CCCCFF','#FFCC99','#CCFF99','#66CCFF','#99CCFF','#CCFFCC','#99CC99','#CCCC99','#FF9969']
    const index = feature.properties.adcode % 13
    return colors[index]
}
```

[在线示例](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleUniqueValue3)



## 方式四：从属性中取颜色

这种方式比较简单，就是直接把颜色放到数据中，通过 get 表达式获取出来直接用。缺点就是要去改数据。

下图是在数据中增加颜色数据：

![](http://blogimage.gisarmory.xyz/20220120162641.png)

使用表达式直接获取颜色：

```js
 "fill-color":['get','color']
```

[在线示例](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleUniqueValue4)



## 方式五：分图层设置颜色

通过图层的 `filter`筛选条件实现，每个区设置成一个图层，然后设置每个图层的颜色。

图层样式设置方式：

```json
[
    {
        "id": "beijing-haidian",
        "type": "fill",
        "source": "beijing",
        "paint":{
            "fill-color":'#FFCC99'
        },
        "filter":["==",["get","name"], "海淀区"]
	},
    {
        "id": "beijing-chaoyang",
        "type": "fill",
        "source": "beijing",
        "paint":{
            "fill-color":'#FFCCCC'
        },
        "filter":["==",["get","name"], "朝阳区"]
    }
    ...
]
```

这种做法的好处是，可以在 maputnik 中直接选颜色，因为在 maputnik 中，表达式是不支持直接在界面上选颜色的，只能自己编辑。

选颜色效果如下图：

![](http://blogimage.gisarmory.xyz/20220120162635.png)

这种方式的缺点也很明显：图层由一个变成了16个，style 文件会变的很啰嗦，图层管理不太方便。

[在线示例](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleUniqueValue1)



## 最后

后续会将表达式作为一个系列更新几篇，敬请关注。

<br>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleUniqueValue](http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleUniqueValue)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。













```js

```



