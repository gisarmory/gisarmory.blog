# mapboxgl 地图样式 - 重分类渲染

上回，我们在[《mapboxgl 地图样式 - 唯一值渲染》](https://blog.csdn.net/gisarmory/article/details/122605374?spm=1001.2014.3001.5502)中了解到case、match、get等表达式，通过表达式来完成了唯一值渲染。

在实际情况下，我们还经常需要进行重分类渲染，将某范围的值重分为一类，并将另一个范围重分为其它类。

今天我们继续了解新的表达式来实现重分类渲染。

重分类效果图：

![](http://blogimage.gisarmory.xyz/20220209172552.png)



## 方式一：使用 case 表达式

case表达式类似js里的if判断语句。表达式的实现效果比较依赖于属性值，通常我们先使用`get表达式`去获取属性值，再去判断这个属性值，以此达到在同一图层上实现不同的展示效果。

```js
"fill-color":[
    "case",
    ['boolean',['<',["get","population"],50]],"#ffd0a6",
    ['boolean',['<',["get","population"],100]],"#ffaa7f",
    ['boolean',['<',["get","population"],150]],"#ff704e",
    ['boolean',['<',["get","population"],200]],"#f04040",
    '#b50a09'
]
```

上面表达式的意思是：

get获取属性值population，小于50，颜色是#ffd0a6

大于等于50，但小于100时，颜色是#ffaa7f

大于等于100，但小于150时，颜色是#ff704e

大于等于150，但小于200时，颜色是#f04040

大于等于200，颜色是#b50a09

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass1](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass1)

翻译成js是

```javascript
function getColor(feature){  //feature是geojosn格式中的Feature
  if(feature.properties.population<50){    
    return '#ffd0a6'
  }
  else if(feature.properties.population<100){  
    return '#ffaa7f'
  }
  ...
  else{
    return '#b50a09'
  }
}
```



## 方式二：使用step表达式

```javascript
"fill-color":[
    "step",
    ["get","population"],
    "#ffd0a6", 50,
    "#ffaa7f", 100, 
    "#ff704e", 150, 
    "#f04040", 200, 
    "#b50a09"
]
```

上面表达式的意思还是：

get获取属性值population，小于50，颜色是#ffd0a6

大于等于50，但小于100时，颜色是#ffaa7f

大于等于100，但小于150时，颜色是#ff704e

大于等于150，但小于200时，颜色是#f04040

大于等于200，颜色是#b50a09

看到这里是不是奇怪step是起什么作用的？step译为步，一步一步就是分段的意思，他产生阶梯式结果，把一段值归为一类，小于50的是一类，大于等于50又小于100是一类，每一类step都会输出一个值，在效果图中展示为50万人口以下地区是一个颜色，大于等于50又小于100万人口区间的地区为另一个颜色。（我们在下篇渐变色渲染的文章中将会了解interpolate表达式，与step表达式产生的阶梯式结果相反，interpolate表达式将会产生连续结果。）

翻译成js还是

```js
function getColor(feature){  //feature是geojosn格式中的Feature
  if(feature.properties.population<50){    
    return '#ffd0a6'
  }
  else if(feature.properties.population<100){  
    return '#ffaa7f'
  }
  ...
  else{
    return '#b50a09'
  }
}
```

step表达式有自己的固定用法：

1. `"step"`是表达式的名称

2. `["get","adcode"]`是输入值，必须为数值类型或者是数值表达式

3. `#ffd0a6"`是输出值
4. `50`,是判断值
5. `"#ffaa7f"`是输出值
6. `100`,是判断值
7. ...

step表达式有5个必需参数，并且不能乱序：表达式的名称、输入值、输出值、判断值，... ...，输出值（省略部分为输出值、判断值，在省略部分里如果出现了，就必须两两出现）。也就是说除了表达式的名称和输入值以外，最少还需要一个输出值、一个判断值、再加一个输出值。

```js
//必需参数
"fill-color":[
    "step", //表达式的名称
    ["get","population"], //输入值
    "#ffd0a6",  //输出值
    50, //判断值
    "#b50a09" //输出值
]
```

注意：判断值必须遵循升序规则。

缺点：只能对数值进行重分类。

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass2](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass2)



## 方式三：分图层设置

```js
// in 确定某元素是否存在于数组中，或子字符串是否存在于字符串中。
{
    "id": "beijing400",
        "type": "fill",
            "source": "beijing",
                "paint":{
                    "fill-color":"#f04040"
                },
                    "filter":[ "in","name","延庆区","怀柔区","密云区","平谷区"]
},
// match
{
    "id": "beijing400",
        "type": "fill",
            "source": "beijing",
                "paint":{
                    "fill-color":"#f04040"
                },
                    "filter": ["match",[ "get","name"],["延庆区","怀柔区","密云区","平谷区"],true,false]
}
```

in表达式的意思是判断要素的属性值name，是否存在于 `"延庆区","怀柔区","密云区","平谷区"` 这里面

match表达式里，先get要素的属性值name，再用match去匹配这个name是否存在于 `["延庆区","怀柔区","密云区","平谷区"]`这个数组里,存在就返回true，不存在就返回默认值false。具体的可以在[《mapboxgl 地图样式 - 唯一值渲染》](https://blog.csdn.net/gisarmory/article/details/122605374?spm=1001.2014.3001.5502)文中了解。

两者实现效果和思路是一样的，只在写法上稍有不同，in表达式里，不需要嵌套`get表达式`即可获取到要素的属性值，in表达式里的匹配范围也可以不写成数组，而是直接作为单个的参数写入。

优点：

1. 不仅可以针对数字进行重分类，还对针对字符串等其它任意类型的值进行重分类。
2. 可以在maputnik中直接调颜色。

缺点：

1. 图层变多，图层管理不太方便。

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass3](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass3)



<br>

* * *

原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleReclass](http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleReclass)

欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》

![](http://blogimage.gisarmory.xyz/20200923063756.png)

本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接：  [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。



