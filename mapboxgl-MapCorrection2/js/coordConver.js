import {isArray} from './Util.js'

//坐标转换
var pi = 3.1415926535897932384626;
var a = 6378245.0;
var ee = 0.00669342162296594323;
var x_pi = pi * 3000.0 / 180.0;
var R = 6378137;

//经纬度转xyz协议瓦片编号
export function lonLatToTileNumbers(lon_deg, lat_deg, zoom) {
    var lat_rad = (pi/180)*lat_deg     //math.radians(lat_deg)  角度转弧度
    var n = Math.pow(2, zoom)
    var xtile = parseInt((lon_deg + 180.0) / 360.0 * n)
    var ytile = parseInt((1.0 - Math.asinh(Math.tan(lat_rad)) / pi) / 2.0 * n)  
    return [xtile, ytile]
}

//xyz协议瓦片编号转经纬度
export function tileNumbersToLonLat(xtile, ytile, zoom) {
    let n = Math.pow(2, zoom)
    let lon_deg = xtile / n * 360.0 - 180.0
    let lat_rad = Math.atan(Math.sinh(pi * (1 - 2 * ytile / n)))

    let lat_deg = lat_rad * 180.0 / pi
    return [lon_deg, lat_deg]
}

/**百度转84*/
export function bd09_To_gps84(lng, lat) {
    var gcj02 = this.bd09_To_gcj02(lng, lat);
    var map84 = this.gcj02_To_gps84(gcj02.lng, gcj02.lat);
    return map84;
}
/**84转百度*/
export function gps84_To_bd09(lng, lat) {
    var gcj02 = this.gps84_To_gcj02(lng, lat);
    var bd09 = this.gcj02_To_bd09(gcj02.lng, gcj02.lat);
    return bd09;
}
/**84转火星*/
export function gps84_To_gcj02(lng, lat) {
    if(isArray(lng)){
        var _lng = lng[0]
        lat = lng[1]
        lng = _lng
    }
    if(lng instanceof Object){
        var _lng = lng.lng
        lat = lng.lat
        lng = _lng
    }

    var dLat = transformLat(lng - 105.0, lat - 35.0);
    var dLng = transformLng(lng - 105.0, lat - 35.0);
    var radLat = lat / 180.0 * pi;
    var magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
    var mgLat = lat + dLat;
    var mgLng = lng + dLng;
    var newCoord = {
        lng: mgLng,
        lat: mgLat
    };
    return newCoord;
}
/**火星转84*/
export function gcj02_To_gps84(lng, lat) {
    if(isArray(lng)){
        var _lng = lng[0]
        lat = lng[1]
        lng = _lng
    }
    if(lng instanceof Object){
        var _lng = lng.lng
        lat = lng.lat
        lng = _lng
    }

    var coord = transform(lng, lat);
    var lontitude = lng * 2 - coord.lng;
    var latitude = lat * 2 - coord.lat;
    var newCoord = {
        lng: lontitude,
        lat: latitude
    };
    return newCoord;
}
/**火星转百度*/
export function gcj02_To_bd09(x, y) {
    var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
    var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
    var bd_lng = z * Math.cos(theta) + 0.0065;
    var bd_lat = z * Math.sin(theta) + 0.006;
    var newCoord = {
        lng: bd_lng,
        lat: bd_lat
    };
    return newCoord;
}
/**百度转火星*/
function bd09_To_gcj02(bd_lng, bd_lat) {
    var x = bd_lng - 0.0065;
    var y = bd_lat - 0.006;
    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    var gg_lng = z * Math.cos(theta);
    var gg_lat = z * Math.sin(theta);
    var newCoord = {
        lng: gg_lng,
        lat: gg_lat
    };
    return newCoord;
}



function transform(lng, lat) {
    var dLat = transformLat(lng - 105.0, lat - 35.0);
    var dLng = transformLng(lng - 105.0, lat - 35.0);
    var radLat = lat / 180.0 * pi;
    var magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
    var mgLat = lat + dLat;
    var mgLng = lng + dLng;
    var newCoord = {
        lng: mgLng,
        lat: mgLat
    };
    return newCoord;
}

function transformLat(x, y) {
    var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLng(x, y) {
    var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
    return ret;
}
