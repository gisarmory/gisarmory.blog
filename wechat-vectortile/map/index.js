// pages/map/index.js


const appcoord = require('../../utils/appcoord.js');
let tileData = {}
let handelNum = 0
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 地图 start
    longitude: 119.553,
    latitude: 32.157,
    markers: [{
      iconPath: '/images/mapicon/center.png',
      latitude: 32.157, //纬度 
      longitude: 119.553, //经度 
      width: 32,
      height: 33
    }],
    polylines: [],
    polygons: [],
    showTileIds: []
    // 地图 end
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getXYZ(119.553, 32.157, 11)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  bindregionchange: function (e) {
    if (e.type === 'end') {
      console.log(e.detail.centerLocation.longitude, e.detail.centerLocation.latitude, e.detail.scale)
      this.setData({
        polygons: [],
        // polylines: [],
        // markers: []
      })
      var level = Math.ceil(e.detail.scale)
      if (e.detail.scale > 18) {
        level = 18
      }

      // this.getXYZ(e.detail.centerLocation, level)
      this.getXYZList(e.detail.region, level)
    }
  },

  getXYZ: function (center, level) {
    var newcenter = appcoord.gcj02_To_gps84(center.longitude, center.latitude);
    var xyzInfo = this.getTileXY(newcenter.lng, newcenter.lat, level)
    this.getGeoJson(xyzInfo.x, xyzInfo.y, xyzInfo.z)
    console.log(xyzInfo)

    var markers = this.data.markers
    markers.push(this.getMarker1(center.longitude, center.latitude))
    this.setData({
      markers: markers,
      polygons: [this.getPolygon(xyzInfo.bottomrightx, xyzInfo.bottomrighty, xyzInfo.topleftx, xyzInfo.toplefty)]
    })

  },

  getXYZList: function (region, level) {
    var newsouthwest = appcoord.gcj02_To_gps84(region.southwest.longitude, region.southwest.latitude);
    var northeastwest = appcoord.gcj02_To_gps84(region.northeast.longitude, region.northeast.latitude);
    var xyzInfo1 = this.getTileXY(newsouthwest.lng, northeastwest.lat, level)
    var xyzInfo2 = this.getTileXY(northeastwest.lng, newsouthwest.lat, level)
    var z = level - 1
    var showTileIds = []
    var needShowTileIds = []
    for (var x = xyzInfo1.x; x <= xyzInfo2.x; x++) {
      for (var y = xyzInfo1.y; y <= xyzInfo2.y; y++) {
        var tileId = 'tile-' + x + '-' + y + '-' + z
        showTileIds.push(tileId)
        if (!tileData[tileId]) {
          this.getGeoJson(x, y, z)
        } else {
          needShowTileIds.push(tileId)
        }
      }
    }
    if (showTileIds.toString() !== this.data.showTileIds.toString()) {
      handelNum = 0
      this.setData({
        showTileIds: showTileIds
      })
      this.removeNotShowTiles(showTileIds)
      needShowTileIds.forEach(item => {
        this.addFeatures(item)
      })
    }
  },

  removeNotShowTiles: function (showTileIds) {
    var polylines = this.data.polylines
    var markers = this.data.markers
    var showPolylines = []
    var showMarkers = []
    markers.forEach(marker => {
      if (showTileIds.includes(marker.tileId)) {
        showMarkers.push(marker)
      }
    })
    polylines.forEach(polyline => {
      if (showTileIds.includes(polyline.tileId)) {
        showPolylines.push(polyline)
      }
    })
    this.setData({
      polylines: showPolylines,
      markers: showMarkers
    })
  },

  getTileXY: function (lon, lat, level) {
    let originX = -180; //坐标系原点的x的值，我这里用的4326，
    let originY = 90; //坐标系原点的y的值
    //根据你自己对应的切片方案改，这个就是其分辨率resolution
    let resolution = [1.40625, 0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625,
      0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 0.0006866455078125, 0.0003433227539062,
      0.0001716613769531, 0.0000858306884766, 0.0000429153442383, 0.0000214576721191, 0.0000107288360596,
      0.0000053644180298, 0.0000026822090149, 0.0000013411045074, 0.0000006705522537, 0.0000003352761269
    ]

    let tileSize = 256 //这个值表示的是每张切片的大小,一般都是256
    let coef = resolution[level] * tileSize;
    let x = Math.floor((lon - originX) / coef); // 向下取整,丢弃小数部分
    let y = Math.floor((originY - lat) / coef); // 向下取整,丢弃小数部分
    let topleftx = originX + (x * coef) // 原点x坐标为-180，因此需要 originX + 
    let toplefty = originY - (y * coef) // 原点y坐标为90，因此需要 originY - 
    let bottomrightx = originX + ((x + 1) * coef)
    let bottomrighty = originY - ((y + 1) * coef)
    let tmsY = Math.pow(2, (level - 1)) - y - 1
    return {
      x: x,
      y: y,
      z: level - 1,
      tmsY: tmsY,
      //该Tile瓦片的地理坐标范围
      topleftx: topleftx, //左上角
      toplefty: toplefty,
      bottomrightx: bottomrightx, //右下角
      bottomrighty: bottomrighty
    }
  },
  getGeoJson: function (x, y, z) {
    const v = this
    wx.request({
      url: "http://127.0.0.1:7000/geoserver/gwc/service/wmts/rest/test:test/EPSG:4326/EPSG:4326:" +
        z + "/" + y + "/" + x + "?format=application/json;type=geojson",
      method: 'get',
      success(res) {
        var tileId = 'tile-' + x + '-' + y + '-' + z
        tileData[tileId] = {
          x: x,
          y: y,
          z: z,
          tileId: tileId,
          features: []
        }
        if(res.statusCode === 200){
          tileData[tileId].features = res.data.features
        }
        v.addFeatures(tileId)
      }
    })
  },

  addFeatures: function (tileId) {
    handelNum++
    var polylines = this.data.polylines
    var markers = this.data.markers
    tileData[tileId].features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        var color = '#00B76C'
        if (feature.properties.category === 1) {
          color = '#00B76C'
        } else if (feature.properties.category === 2) {
          color = '#F1383D'
        } else if (feature.properties.category === 3) {
          color = '#D249FB'
        }
        polylines.push(this.getPolyline(feature.geometry.coordinates, color, tileId))
        // } else if (feature.geometry.type === 'Point') {
        //   markers.push(this.getMarker(feature.geometry.coordinates, tileId))
      }
    });
    if (handelNum === this.data.showTileIds.length) {
      this.setData({
        polylines: polylines,
        markers: markers
      })
    }
  },

  getMarker1: function (lng, lat) {
    var marker = {
      iconPath: '/images/mapicon/center.png',
      latitude: lat, //纬度 
      longitude: lng, //经度 
      width: 32,
      height: 32,
      anchor: {
        x: 0.5,
        y: 0.5
      }
    }
    return marker
  },
  getMarker: function (coordinates, tileId) {
    var newCoord = appcoord.gps84_To_gcj02(coordinates[0], coordinates[1]);
    var marker = {
      tileId: tileId,
      iconPath: '/images/mapicon/center.png',
      latitude: Number(newCoord.lat.toFixed(6)), //纬度 
      longitude: Number(newCoord.lng.toFixed(6)), //经度  
      width: 16,
      height: 16,
      anchor: {
        x: 0.5,
        y: 0.5
      }
    }
    return marker
  },
  getPolyline: function (coordinates, color, tileId) {
    var points = []
    coordinates.forEach(point => {
      var newCoord = appcoord.gps84_To_gcj02(point[0], point[1]);
      points.push({
        tileId: tileId,
        latitude: Number(newCoord.lat.toFixed(6)), //纬度 
        longitude: Number(newCoord.lng.toFixed(6)), //经度 
      })
    })
    var polyline = {
      points: points,
      color: color,
      width: 2
    }
    return polyline
  },
  getPolygon: function (x1, y1, x2, y2) {
    var newCoord1 = appcoord.gps84_To_gcj02(x1, y1);
    var newCoord2 = appcoord.gps84_To_gcj02(x2, y2);
    x1 = newCoord1.lng
    y1 = newCoord1.lat
    x2 = newCoord2.lng
    y2 = newCoord2.lat

    var points = [{
      longitude: x1,
      latitude: y1
    }, {
      longitude: x1,
      latitude: y2
    }, {
      longitude: x2,
      latitude: y2
    }, {
      longitude: x2,
      latitude: y1
    }]
    var polygon = {
      points: points,
      strokeWidth: 3,
      strokeColor: "#3E68F780",
      fillColor: "#3E68F740",
    }
    return polygon
  }
})