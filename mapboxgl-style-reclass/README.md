# mapboxgl 地图样式 - 重分类渲染

上回，我们在[《mapboxgl 地图样式 - 唯一值渲染》](http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleUniqueValue)中了解到case、match、get等表达式，通过表达式来完成了唯一值渲染。

在实际情况下，我们还经常需要进行重分类渲染，将某范围的值重分为一类，并将另一个范围重分为其它类。

今天我们继续了解新的表达式来实现重分类渲染。

重分类效果图：

![](http://blogimage.gisarmory.xyz/20220209172552.png)



## 方式一：使用step表达式

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

上面表达式的意思是：

- get获取属性值population，小于50，颜色是`#ffd0a6`
- 大于等于50，但小于100时，颜色是`#ffaa7f`
- 大于等于100，但小于150时，颜色是`#ff704e`
- 大于等于150，但小于200时，颜色是`#f04040`
- 大于等于200，颜色是`#b50a09`

看到这里是不是奇怪step是起什么作用的？step译为步，一步一步就是分段的意思，它产生阶梯式结果，把一段值归为一类，小于50的是一类，大于等于50又小于100是一类，每一类step都会输出一个值，在效果图中展示为50万人口以下地区是一个颜色，大于等于50又小于100万人口区间的地区为另一个颜色。

> 我们在下篇渐变色渲染的文章中将会了解interpolate表达式，与step表达式产生的阶梯式结果相反，interpolate表达式将会产生连续结果。

翻译成js是：

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

step表达式语法规则：

1. `"step"`是表达式的名称
2. `["get","adcode"]`是输入值，必须为数值类型或者是数值表达式
3. `"#ffd0a6"`是输出值
4. `50`是判断值
5. ...（根据实际情况两两出现的输出值、判断值）
6. `"#b50a09"`是输出值

step表达式有5个必需参数，并且不能乱序：表达式的名称、输入值、输出值、判断值，... ...，输出值（省略部分为*输出值、判断值*，在省略部分里如果出现了，就必须两两出现）。也就是说除了表达式的名称和输入值以外，最少还需要一个输出值、一个判断值、再加一个输出值。

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

step表达式写起来较为简洁，但需要注意的一点是**判断值必须遵循升序规则**。

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass2](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass2)



## 方式二：使用 case 表达式

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

- t获取属性值population，小于50，颜色是`#ffd0a6`

- 大于等于50，但小于100时，颜色是`#ffaa7f`
- 大于等于100，但小于150时，颜色是`#ff704e`
- 大于等于150，但小于200时，颜色是`#f04040`
- 大于等于200，颜色是`#b50a09`

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass1](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass1)

翻译成js是：

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

case表达式写起来较为繁琐，但它对判断值没有升序这种要求，只要是true或false就行了。



## 方式三：分图层设置

```js
{
    "id": "beijing200plus",
    "type": "fill",
    "source": "beijing",
    "paint":{
        "fill-color":"#b50a09"
    },
    "filter":['>=',["get","population"],200]
},
{
    "id": "beijing200",
    "type": "fill",
    "source": "beijing",
    "paint":{
        "fill-color":"#f04040"
    },
    "filter":['all',['<',["get","population"],200],['>=',["get","population"],150]]
},
{
    "id": "beijing150",
    "type": "fill",
    "source": "beijing",
    "paint":{
        "fill-color":"#ff704e"
    },
    "filter":['all',['<',["get","population"],150],['>=',["get","population"],100]]
},
{
    "id": "beijing100",
    "type": "fill",
    "source": "beijing",
    "paint":{
        "fill-color":"#ffaa7f"
    },
    "filter":['all',['<',["get","population"],100],['>=',["get","population"],50]]
},
{
    "id": "beijing50",
    "type": "fill",
    "source": "beijing",
    "paint":{
        "fill-color":"#ffd0a6"
    },
    "filter":['<',["get","population"],50]
}
```

分图层是使用filter筛选实现，上面代码里出现了新的表达式all，all表达式相当于js里的`&&`，当他后面的参数都为true就会返回true，否则返回false，我们举个例子：

```js
"filter":['all',['<',["get","population"],200],['>=',["get","population"],150]]
```

翻译成js是：

```js
function getFilter(feature){  //feature是geojosn格式中的Feature
  if(feature.properties.population<200 && feature.properties.population>=150){
      return true
  }else{
      return false
  }
}
```

filter分图层可以在maputnik中直接调颜色，但是图层会变多，不方便管理。

在线示例：[http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass3](http://gisarmory.xyz/blog/index.html?demo=mapboxglStyleReclass3)



## 最后小结：

1. case和filter的优点都是相对于step而言的，而且case和filter写起来都避免不了繁琐这一点。
2. 仅从“重分类”概念的角度来说，最合适的表达式是step，它本身产生分段式结果会更契合“重分类”这一概念。
3. case和filter更适合作为一种“补充”，在某些情况下使用。因为它们并不要求判断值必须升序，更为灵活。
4. 在mapbox里重分类更推荐使用step表达式，case表达式和filter分图层可以作为补充方法来了解。

<br>
* * *


原文地址：[http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleReclass](http://gisarmory.xyz/blog/index.html?blog=mapboxglStyleReclass)



欢迎关注《[GIS兵器库](http://gisarmory.xyz/blog/index.html?blog=wechat)》



![](http://blogimage.gisarmory.xyz/20200923063756.png)



本文章采用 [知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议 ](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)进行许可。欢迎转载、使用、重新发布，但务必保留文章署名《GIS兵器库》（包含链接： [http://gisarmory.xyz/blog/](http://gisarmory.xyz/blog/)），不得用于商业目的，基于本文修改后的作品务必以相同的许可发布。