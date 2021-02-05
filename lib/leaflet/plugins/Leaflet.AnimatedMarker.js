L.AnimatedMarker = L.Marker.extend({
  options: {
    // meters
    distance: 20,
    // ms
    interval: 20,
    // animate on add?
    autoStart: false,
    // callback onend
    onEnd: function () {},
    clickable: false,
    isRotate: false,
    isPlay: false,
    playCall: null
  },

  initialize: function (latlngs, options) {
    this.setLine(latlngs);
    L.Marker.prototype.initialize.call(this, latlngs[0], options);
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function (latlngs) {
    var i,
      len = latlngs.length,
      chunkedLatLngs = [];

    for (i = 1; i < len; i++) {
      var cur = latlngs[i - 1],
        next = latlngs[i],
        dist = cur.distanceTo(next),
        factor = this.options.distance / dist,
        dLat = factor * (next.lat - cur.lat),
        dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
        chunkedLatLngs.push(cur);
        while (dist > this.options.distance) {
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          dist = cur.distanceTo(next);
          chunkedLatLngs.push(cur);
        }
      } else {
        chunkedLatLngs.push(cur);
      }
    }
    chunkedLatLngs.push(latlngs[len - 1]);

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Marker.prototype.onAdd.call(this, map);
    this.animate()

    // Start animating when added to the map
    if (this.options.autoStart) {
      this.start();
    }
  },

  animate: function () {
    var self = this,
      len = this._latlngs.length,
      speed = this.options.interval,
      rotation = 0;

    // 用于动态轨迹线展示
    if(this.options.playCall){
      this.options.playCall(this._i)
    }

    // Normalize the transition speed from vertex to vertex
    if (this._i < len && this._i > 0) {
      speed = this._latlngs[this._i - 1].distanceTo(this._latlngs[this._i]) / this.options.distance * this.options.interval;
      // 角度计算
      rotation = this.getRotation(this._latlngs[this._i - 1], this._latlngs[this._i])
    } else if (this._i === 0){
      speed = this._latlngs[0].distanceTo(this._latlngs[1]) / this.options.distance * this.options.interval;
      // 角度计算
      rotation = this.getRotation(this._latlngs[0], this._latlngs[1])
    }

    // Move to the next vertex
    this.setLatLng(this._latlngs[this._i]);
    this._i++;

    // Only if CSS3 transitions are supported
    if (L.DomUtil.TRANSITION) {
      // 设置图标旋转角度
      if (this.options.isRotate) {
        var _iconAnchor = this.options.icon.options.iconAnchor
        if (this._icon) {
          this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = _iconAnchor[0] + 'px ' + _iconAnchor[1] + 'px'
          this._icon.style[L.DomUtil.TRANSFORM] += 'rotateZ(-' + rotation + 'deg)';
          this._icon.style[L.DomUtil.TRANSITION] = ('all ' + speed + 'ms linear');
        }
        if (this._shadow) {
          this._shadow.style[L.DomUtil.TRANSFORM + 'Origin'] = _iconAnchor[0] + 'px ' + _iconAnchor[1] + 'px'
          this._shadow.style[L.DomUtil.TRANSFORM] += 'rotateZ(-' + rotation + 'deg)';
          this._shadow.style[L.DomUtil.TRANSITION] = 'all ' + speed + 'ms linear';
        }
      } else {
        if (this._icon) {
          this._icon.style[L.DomUtil.TRANSITION] = ('all ' + speed + 'ms linear');
        }
        if (this._shadow) {
          this._shadow.style[L.DomUtil.TRANSITION] = 'all ' + speed + 'ms linear';
        }
      }
    }

    // Queue up the animation to the next next vertex
    this._tid = setTimeout(function () {
      if (self._i === len) {
        self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
      } else {
        if (self.options.isPlay) {
          self.animate();
        }
      }
    }, speed);
  },

  // Start the animation
  start: function () {
    this.options.isPlay = true
    this.animate()
  },

  pause: function () {
    this.options.isPlay = false
  },

  // Stop the animation in place
  stop: function () {
    this.options.isPlay = false
    this._i = 0
    this.animate();
    // if (this._tid) {
    //   clearTimeout(this._tid);
    // }
  },

  setLine: function (latlngs) {
    // if (L.DomUtil.TRANSITION) {
    //   // No need to to check up the line if we can animate using CSS3
    //   this._latlngs = latlngs;
    // } else {
    // Chunk up the lines into options.distance bits
    this._latlngs = this._chunk(latlngs);
    // this.options.distance = 10;
    // this.options.interval = 30;
    // }
    this._i = 0;
  },

  getNewLine: function (){
    return this._latlngs
  },

  getRotation: function (start, end) {
    var dx = end.lng - start.lng;
    var dy = end.lat - start.lat;
    var radian = Math.atan2(dy, dx); //弧度值
    var rotation = 180 * radian / Math.PI //转换为角度值
    if (rotation > -180 && rotation < 0) {
      rotation = 360 + rotation;
    }
    return rotation
  }

});

L.animatedMarker = function (latlngs, options) {
  return new L.AnimatedMarker(latlngs, options);
};