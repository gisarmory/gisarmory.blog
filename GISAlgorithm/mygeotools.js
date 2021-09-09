/**
 * 计算两经纬度点之间的距离(单位：米)
 * @param p1 起点的坐标；[经度,纬度]；例：[116.35,40.08]
 * @param p2 终点的坐标；[经度,纬度]；例：[116.72,40.18]
 *
 * @return d 返回距离
 */
function getDistance(p1, p2) {
    var rlat1 = p1[1] * Math.PI / 180.0;
    var rlat2 = p2[1] * Math.PI / 180.0;
    var a = rlat1 - rlat2;
    var b = p1[0] * Math.PI / 180.0 - p2[0] * Math.PI / 180.0;
    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(b / 2), 2)));
    d = d * 6378.137;
    d = Math.round(d * 10000) / 10;
    return d
}

/**
 * 根据已知线段以及到起点距离（单位：米），求目标点坐标
 * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
 * @param dis 到起点距离（米）；Number；例：500
 *
 * @return point 返回坐标
 */
function getLinePoint(line, dis) {
    var p1 = line[0]
    var p2 = line[1]
    var d = getDistance(p1, p2)
    var dx = p2[0] - p1[0]
    var dy = p2[1] - p1[1]
    return [p1[0] + dx * (dis / d), p1[1] + dy * (dis / d)]
}

/**
 * 已知点、线段，求垂足
 * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
 * @param p 点；[经度,纬度]；例：[116.35,40.08]
 *
 * @return point 返回垂足坐标
 */
function getFootPoint(line, p) {
    var p1 = line[0]
    var p2 = line[1]
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];
    var cross = dx * (p[0] - p1[0]) + dy * (p[1] - p1[1])
    var d2 = dx * dx + dy * dy
    var u = cross / d2
    return [(p1[0] + u * dx), (p1[1] + u * dy)]
}


/**
 * 线段上距离目标点最近的点
 * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
 * @param p 点；[经度,纬度]；例：[116.35,40.08]
 *
 * @return point 最近的点坐标
 */
function getShortestPointInLine(line, p) {
    var p1 = line[0]
    var p2 = line[1]
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];
    var cross = dx * (p[0] - p1[0]) + dy * (p[1] - p1[1])
    if (cross <= 0) {
        return p1
    }
    var d2 = dx * dx + dy * dy
    if (cross >= d2) {
        return p2
    }
    // 垂足
    var u = cross / d2
    return [(p1[0] + u * dx), (p1[1] + u * dy)]
}



/**
 * 点缓冲
 * @param center 中心点；[经度,纬度]；例：[116.35,40.08]
 * @param radius 半径（米）；Number；例：5000
 * @param vertices 返回圆面点的个数；默认64；Number；例：32
 *
 * @return coords 面的坐标
 */
function bufferPoint(center, radius, vertices) {
    if (!vertices) vertices = 64;
    var coords = []
    // 111319.55：在赤道上1经度差对应的距离，111133.33：在经线上1纬度差对应的距离
    var distanceX = radius / (111319.55 * Math.cos(center[1] * Math.PI / 180));
    var distanceY = radius / 111133.33;
    var theta, x, y;
    for (var i = 0; i < vertices; i++) {
        theta = (i / vertices) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);
        coords.push([center[0] + x, center[1] + y]);
    }
    return [coords]
}


/**
 * 点和面关系
 * @param point 点；[经度,纬度]；例：[116.353455, 40.080173]
 * @param polygon 面；geojson格式中的coordinates；例：[[[116.1,39.5],[116.1,40.5],[116.9,40.5],[116.9,39.5]],[[116.3,39.7],[116.3,40.3],[116.7,40.3],[116.7,39.7]]]
 *
 * @return inside 点和面关系；0:多边形外，1：多边形内，2：多边形边上
 */
function pointInPolygon(point, polygon) {
    var isInNum = 0
    for (var i = 0; i < polygon.length; i++) {
        var inside = pointInRing(point, polygon[i])
        if (inside === 2) {
            return 2
        } else if (inside === 1) {
            isInNum++
        }
    }
    if (isInNum % 2 == 0) {
        return 0
    } else if (isInNum % 2 == 1) {
        return 1
    }
}

/**
 * 点和面关系
 * @param point 点
 * @param ring 单个闭合面的坐标
 * 
 * @return inside 点和面关系，0:多边形外，1：多边形内，2：多边形边上
 */
function pointInRing(point, ring) {
    var inside = false,
        x = point[0],
        y = point[1]

    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0],
            yi = ring[i][1],
            xj = ring[j][0],
            yj = ring[j][1]

        if (xi == xj && yi == yj) {
            continue
        }
        // 判断点与线段的相对位置，0为在线段上，>0 点在左侧，<0 点在右侧
        if (isLeft(point, [ring[i], ring[j]]) === 0) {
            return 2 // 点在多边形边上
        } else {
            if ((yi > y) !== (yj > y)) { // 垂直方向目标点在yi、yj之间
                // 求目标点在当前线段上的x坐标。 由于JS小数运算后会转换为精确15位的float，因此需要去一下精度
                var xx = Number(((xj - xi) * (y - yi) / (yj - yi) + xi).toFixed(10))
                if (x <= xx) { // 目标点水平射线与当前线段有交点
                    inside = !inside
                }
            }
        }
    }
    return Number(inside)
}

/**
 * 判断点与线段的相对位置
 * @param point 目标点
 * @param line 线段
 * 
 * @return isLeft，点与线段的相对位置，0为在线段上，>0 p在左侧，<0 p在右侧
 */
function isLeft(point, line) {
    var isLeft = ((line[0][0] - point[0]) * (line[1][1] - point[1]) - (line[1][0] - point[0]) * (line[0][1] - point[1]))
    // 由于JS小数运算后会转换为精确15位的float，因此需要去一下精度
    return Number(isLeft.toFixed(10))
}

/**
 * 线段与线段的关系
 * @param line1 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
 * @param line2 线段；[[经度,纬度],[经度,纬度]]；例：[[116.33,40.21],[116.36,39.76]]
 *
 * @return intersect 线段与线段的关系；0:相离，1：相交，2：相切
 */
function intersectLineAndLine(line1, line2) {
    var x1 = line1[0][0],
        y1 = line1[0][1],
        x2 = line1[1][0],
        y2 = line1[1][1],
        x3 = line2[0][0],
        y3 = line2[0][1],
        x4 = line2[1][0],
        y4 = line2[1][1]

    //快速排斥：
    //两个线段为对角线组成的矩形，如果这两个矩形没有重叠的部分，那么两条线段是不可能出现重叠的

    //这里的确如此，这一步是判定两矩形是否相交
    //1.线段ab的低点低于cd的最高点（可能重合）
    //2.cd的最左端小于ab的最右端（可能重合）
    //3.cd的最低点低于ab的最高点（加上条件1，两线段在竖直方向上重合）
    //4.ab的最左端小于cd的最右端（加上条件2，两直线在水平方向上重合）
    //综上4个条件，两条线段组成的矩形是重合的
    //特别要注意一个矩形含于另一个矩形之内的情况
    if (!(Math.min(x1, x2) <= Math.max(x3, x4) && Math.min(y3, y4) <= Math.max(y1, y2) &&
            Math.min(x3, x4) <= Math.max(x1, x2) && Math.min(y1, y2) <= Math.max(y3, y4))) {
        return 0
    }

    // 判断点与线段的相对位置，0为在线段上，>0 点在左侧，<0 点在右侧
    if (isLeft(line1[0], line2) === 0 || isLeft(line1[1], line2) === 0) {
        return 2
    }

    //跨立实验：
    //如果两条线段相交，那么必须跨立，就是以一条线段为标准，另一条线段的两端点一定在这条线段的两段
    //也就是说a b两点在线段cd的两端，c d两点在线段ab的两端
    var kuaili1 = ((x3 - x1) * (y2 - y1) - (x2 - x1) * (y3 - y1)) * ((x4 - x1) * (y2 - y1) - (x2 - x1) * (y4 - y1))
    var kuaili2 = ((x1 - x3) * (y4 - y3) - (x4 - x3) * (y1 - y3)) * ((x2 - x3) * (y4 - y3) - (x4 - x3) * (y2 - y3))
    return Number(Number(kuaili1.toFixed(10)) <= 0 && Number(kuaili2.toFixed(10)) <= 0)
}

/**
 * 线和面关系
 * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
 * @param polygon 面；geojson格式中的coordinates；例：[[[116.1,39.5],[116.1,40.5],[116.9,40.5],[116.9,39.5]],[[116.3,39.7],[116.3,40.3],[116.7,40.3],[116.7,39.7]]]
 *
 * @return intersect 线和面关系；0:相离，1：相交，2：包含，3：内切，4：外切
 */
function intersectLineAndPolygon(line, polygon) {
    var isTangent = false
    var isInNum = 0
    var intersect = 0
    for (var i = 0; i < polygon.length; i++) {
        // 线和面关系，0:相离，1：相交，2：包含，3：内切，4：外切
        intersect = intersectLineAndRing(line, polygon[i])
        if (intersect === 1) {
            return 1
        } else if (intersect === 2) {
            isInNum++
        } else if (intersect === 3) {
            isInNum++
            isTangent = true
        } else if (intersect === 4) {
            isTangent = true
        }
    }
    if (isInNum % 2 == 0) {
        if (isTangent) {
            return 4 // 外切
        } else {
            return 0 // 相离
        }
    } else if (isInNum % 2 == 1) {
        if (isTangent) {
            return 3 // 内切
        } else {
            return 2 // 包含
        }
    }
}

/**
 * 线和面关系
 * @param line 线段
 * @param ring 单面
 * 
 * @return intersect 线和面关系，0:相离，1：相交，2：包含，3：内切，4：外切
 */
function intersectLineAndRing(line, ring) {
    var inserset = 0
    var isTangent = false
    var inserset1 = pointInRing(line[0], ring) // 点和面关系，0:多边形外，1：多边形内，2：多边形边上
    var inserset2 = pointInRing(line[1], ring) // 点和面关系，0:多边形外，1：多边形内，2：多边形边上
    if (inserset1 === inserset2 === 0) {
        inserset = 0
    } else if ((inserset1 * inserset2) === 1) {
        inserset = 2
    } else if ((inserset1 * inserset2) === 2) {
        inserset = 3
    } else if ((inserset1 === 2 || inserset2 === 2) && (inserset1 === 0 || inserset2 === 0)) {
        inserset = 4
    } else if ((inserset1 === 1 || inserset2 === 1) && (inserset1 === 0 || inserset2 === 0)) {
        return 1 // 相交
    }
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var line2 = [ring[j], ring[i]]
        // 目标线段与当前线段的关系，0:相离，1：相交，2：相切
        var intersectLine = intersectLineAndLine(line, line2)
        if (intersectLine == 1) {
            return 1 // 相交
        }
    }
    return inserset
}


/**
 * 面转线
 * @param geojson 面geojson
 * 
 * @return geojson 线geojson
 */
function convertPolygonToPolyline(polygonGeoJson) {
    var polylineGeoJson = JSON.parse(JSON.stringify(polygonGeoJson))

    for (var i = 0; i < polylineGeoJson.features.length; i++) {
        var MultiLineString = []
        if (polylineGeoJson.features[i].geometry.type === 'Polygon') {
            var Polygon = polylineGeoJson.features[i].geometry.coordinates
            Polygon.forEach(LinearRing => {
                var LineString = LinearRing
                MultiLineString.push(LineString)
            })
        } else if (polylineGeoJson.features[i].geometry.type === 'MultiPolygon') {
            var MultiPolygon = polylineGeoJson.features[i].geometry.coordinates
            MultiPolygon.forEach(Polygon => {
                Polygon.forEach(LinearRing => {
                    var LineString = LinearRing
                    MultiLineString.push(LineString)
                })
            })
        } else {
            console.error('请确认输入参数为geojson格式面数据！')
            return null
        }
        polylineGeoJson.features[i].geometry.type = 'MultiLineString' //面转线
        polylineGeoJson.features[i].geometry.coordinates = MultiLineString
    }

    return polylineGeoJson
}