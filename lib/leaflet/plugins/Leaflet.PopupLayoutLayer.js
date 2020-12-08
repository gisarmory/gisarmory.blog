'use strict';
(function(factory, window) {
    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.PopupLayoutLayer = factory(L);
    }
}(function(L) {
    var PopupLayoutLayer = L.Class.extend({

        _map: null,
        markerList: [],
        allMarkerList: [],
        polylineList: [],
        _popupLayer: null,

        options: {
            showAll: false,
            mouseType: 'mouseclick', // 鼠标事件，可选“mouseclick”、“mouseover”，默认为“mouseclick”
            lineStyle: {
                color: '#90A4AE'
            },
            tooltipOptions: {
                pane: 'tooltipPane',
                offset: [0, 0],
                className: '',
                permanent: true,
                interactive: true,
                direction: 'left',
                sticky: 'none',
                opacity: 0.9
            }
        },

        //初始化
        initialize: function(options) {
            L.setOptions(this, options);
            this._popupLayer = L.popup()

            /* remove arrow in tooltips */
            loadStyleString(".leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before, .leaflet-tooltip-left:before, .leaflet-tooltip-right:before { visibility: hidden; }");

            function loadStyleString(css) {
                var style = document.createElement("style");
                try {
                    style.appendChild(document.createTextNode(css));
                } catch (ex) {
                    style.styleSheet.cssText = css;
                }
                var head = document.getElementsByTagName('head')[0];
                head.appendChild(style);
            }
        },

        addTo: function(map) {
            this._map = map
            return this;
        },

        addMarker: function(marker, contentHTML) {
            const self = this
            this._map.addLayer(marker);
            if (!this.options.showAll) {
                marker.options.contentHTML = contentHTML
                if (this.options.mouseType === 'mouseclick') {
                    marker.on('click', function(evt) {
                        self.mouseEventFun(evt)
                    })
                } else if (this.options.mouseType === 'mouseover') {
                    marker.on('mouseover', function(evt) {
                        self.mouseEventFun(evt)
                    })
                }
                this.allMarkerList.push(marker);
            } else {
                marker.bindTooltip(contentHTML, this.options.tooltipOptions);
                this.markerList.push(marker);
            }
        },

        showPopup: function() {
            const self = this
            this.redrawLines(true);

            // event registrations
            this._map.on('zoomstart', function() {
                self.removeAllPolyline();
            });

            this._map.on('zoomend', function() {
                self.redrawLines(true);
            });

            this._map.on('dragend', function() {
                self.redrawLines();
            });

            this._map.on('resize', function() {
                self.redrawLines();
            });
        },

        mouseEventFun: function(evt) {
            this.tooltipClear()
            var markerCount = 0
            this.allMarkerList.forEach(makerItem => {
                if (makerItem.getLatLng().lat === evt.target.getLatLng().lat && makerItem.getLatLng().lng === evt.target.getLatLng().lng) {
                    makerItem.bindTooltip(makerItem.options.contentHTML, this.options.tooltipOptions);
                    this.markerList.push(makerItem);
                    markerCount++
                }
            });
            if (markerCount > 1) {
                // 显示气泡
                this.showPopup()
            } else {
                // 单个气泡显示
                this.tooltipClear()
                this._popupLayer.setLatLng(evt.target.getLatLng())
                    .setContent(evt.target.options.contentHTML)
                    .openOn(map);
            }
        },

        onPolylineCreated: function(ply) {
            ply.setStyle(this.options.lineStyle);
        },

        getMarkers: function() {
            return this.markerList;
        },

        getLine: function(marker) {
            return marker.__ply;
        },

        // 清除
        tooltipClear: function() {
            if (this.markerList.length > 0) {
                this.markerList.forEach(element => {
                    element.unbindTooltip();
                });
                this.markerList = []
                this.removeAllPolyline()
            }
            this._popupLayer.remove()
        },

        redrawLines: function(maintainAllPolyline) {
            if (!maintainAllPolyline) {
                this.setRandomPos();
            }
            this.setRandomPos();
            this.layoutByForce();
            this.setEdgePosition();
            this.drawLine();
        },

        removeAllPolyline: function() {
            var i;
            for (i = 0; i < this.polylineList.length; i++) {
                this._map.removeLayer(this.polylineList[i]);
            }
            this.polylineList = [];
        },

        /**
         * Draw lines between markers and tooltips
         */
        drawLine: function() {
            this.removeAllPolyline();
            for (var i = 0; i < this.markerList.length; i++) {
                var marker = this.markerList[i];
                var markerDom = marker._icon;
                var markerPosition = this.getPosition(markerDom);
                var label = marker.getTooltip();

                var labelDom = label._container;
                var labelPosition = this.getPosition(labelDom);

                var x1 = labelPosition.x;
                var y1 = labelPosition.y;

                var x = markerPosition.x;
                var y = markerPosition.y;

                x1 -= 5;
                y1 += 2;
                if (x1 - x !== 0 || y1 - y !== 0) {
                    if (x1 + labelDom.offsetWidth < markerPosition.x) {
                        x1 += labelDom.offsetWidth;
                    }
                    if (y1 + labelDom.offsetHeight < markerPosition.y) {
                        y1 += labelDom.offsetHeight;
                    }
                    var lineDest = L.point(x1, y1);
                    var destLatLng = this._map.layerPointToLatLng(lineDest);

                    setTimeout(
                        ((marker, destLatLng) => () => {
                            let ply = L.polyline([marker.getLatLng(), destLatLng]);
                            this.onPolylineCreated && this.onPolylineCreated(ply);
                            marker.__ply = ply;
                            this.polylineList.push(ply);
                            ply.addTo(this._map);
                        })(marker, destLatLng),
                        0
                    );
                }
            }
        },

        setRandomPos: function() {
            for (var i = 0; i < this.markerList.length; i++) {
                var marker = this.markerList[i];
                var label = marker.getTooltip();
                var labelDom = label._container;
                var markerDom = marker._icon;
                var markerPosition = this.getPosition(markerDom);
                // var angle = Math.floor(Math.random() * 19 + 1) * 2 * Math.PI / 20;
                var angle = ((2 * Math.PI) / 6) * i;
                var x = markerPosition.x;
                var y = markerPosition.y;
                var dest = L.point(
                    Math.ceil(x + 50 * Math.sin(angle)),
                    Math.ceil(y + 50 * Math.cos(angle))
                );
                L.DomUtil.setPosition(labelDom, dest);
            }
        },

        scaleTo: function(a, b) {
            return L.point(a.x * b.x, a.y * b.y);
        },

        normalize: function(a) {
            var l = a.distanceTo(L.point(0, 0));
            if (l === 0) {
                return a;
            }
            return L.point(a.x / l, a.y / l);
        },

        fa: function(x, k) {
            return (x * x) / k;
        },

        fr: function(x, k) {
            return (k * k) / x;
        },

        /**
         * get position form el.style.transform
         */
        getPosition: function(el) {
            var translateString = el.style.transform
                .split('(')[1]
                .split(')')[0]
                .split(',');
            return L.point(parseInt(translateString[0]), parseInt(translateString[1]));
        },

        /**
         * t is the temperature in the system
         */
        computePositionStep: function(t) {
            var area = (window.innerWidth * window.innerHeight) / 10;
            var k = Math.sqrt(area / this.markerList.length);
            var dpos = L.point(0, 0);
            var v_pos;
            var v;
            var i;

            for (i = 0; i < this.markerList.length; i++) {
                v = this.markerList[i];
                // get position of label v
                v.disp = L.point(0, 0);
                v_pos = this.getPosition(v.getTooltip()._container);

                // compute gravitational force
                for (var j = 0; j < this.markerList.length; j++) {
                    var u = this.markerList[j];
                    if (i !== j) {
                        var u_pos = this.getPosition(u.getTooltip()._container);
                        dpos = v_pos.subtract(u_pos);
                        if (dpos !== 0) {
                            v.disp = v.disp.add(
                                this.normalize(dpos).multiplyBy(this.fr(dpos.distanceTo(L.point(0, 0)), k))
                            );
                        }
                    }
                }
            }

            // compute force between marker and tooltip
            for (i = 0; i < this.markerList.length; i++) {
                v = this.markerList[i];
                v_pos = this.getPosition(v.getTooltip()._container);
                dpos = v_pos.subtract(this.getPosition(v._icon));
                v.disp = v.disp.subtract(
                    this.normalize(dpos).multiplyBy(this.fa(dpos.distanceTo(L.point(0, 0)), k))
                );
            }

            // calculate layout
            for (i = 0; i < this.markerList.length; i++) {
                var disp = this.markerList[i].disp;
                var p = this.getPosition(this.markerList[i].getTooltip()._container);
                var d = this.scaleTo(
                    this.normalize(disp),
                    L.point(Math.min(Math.abs(disp.x), t), Math.min(Math.abs(disp.y), t))
                );
                p = p.add(d);
                p = L.point(Math.ceil(p.x), Math.ceil(p.y));
                L.DomUtil.setTransform(this.markerList[i].getTooltip()._container, p);
            }
        },

        layoutByForce: function() {
            var start = Math.ceil(window.innerWidth / 10);
            var times = 50;
            var t;
            for (var i = 0; i < times; i += 1) {
                t = start * (1 - i / (times - 1));
                this.computePositionStep(t);
            }

            for (i = 0; i < this.markerList.length; i++) {
                var disp = this.markerList[i].disp;
                var p = this.getPosition(this.markerList[i].getTooltip()._container);
                var width = this.markerList[i].getTooltip()._container.offsetWidth;
                var height = this.markerList[i].getTooltip()._container.offsetHeight;
                p = L.point(Math.ceil(p.x - width / 2), Math.ceil(p.y - height / 2));
                L.DomUtil.setTransform(this.markerList[i].getTooltip()._container, p);
            }
        },

        setEdgePosition: function() {
            var bounds = this._map.getBounds();
            var northWest = this._map.latLngToLayerPoint(bounds.getNorthWest());
            var southEast = this._map.latLngToLayerPoint(bounds.getSouthEast());

            for (let i = 0; i < this.markerList.length; i++) {
                var tooltip = this.getPosition(this.markerList[i].getTooltip()._container);
                var marker = this.getPosition(this.markerList[i]._icon);
                var width = this.markerList[i].getTooltip()._container.offsetWidth;
                var height = this.markerList[i].getTooltip()._container.offsetHeight;

                var isEdge = false;
                if (marker.x > northWest.x && tooltip.x < northWest.x) {
                    tooltip.x = northWest.x;
                    isEdge = true;
                } else if (marker.x < southEast.x && tooltip.x > southEast.x - width) {
                    tooltip.x = southEast.x - width;
                    isEdge = true;
                }

                if (marker.y > northWest.y && tooltip.y < northWest.y) {
                    tooltip.y = northWest.y;
                    isEdge = true;
                } else if (marker.y < southEast.y && tooltip.y > southEast.y - height) {
                    tooltip.y = southEast.y - height;
                    isEdge = true;
                }

                if (!isEdge) {
                    if (marker.x < northWest.x && tooltip.x > northWest.x - width) {
                        tooltip.x = northWest.x - width;
                    } else if (marker.x > southEast.x && tooltip.x < southEast.x) {
                        tooltip.x = southEast.x;
                    }

                    if (marker.y < northWest.y && tooltip.y > northWest.y - height) {
                        tooltip.y = northWest.y - height;
                    } else if (marker.y > southEast.y && tooltip.y < southEast.y) {
                        tooltip.y = southEast.y;
                    }
                }

                L.DomUtil.setTransform(this.markerList[i].getTooltip()._container, tooltip);
            }
        }
    });

    L.popupLayoutLayer = function(options) {
        return new PopupLayoutLayer(options);
    };
}, window));