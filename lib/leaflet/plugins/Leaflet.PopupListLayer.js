'use strict';
(function(factory, window) {
    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.PopupListLayer = factory(L);
    }
}(function(L) {
    var PopupListLayer = L.Class.extend({

        _map: null,
        allMarkerList: [],
        _popupLayer: null,

        options: {
            mouseType: 'mouseclick' // 鼠标事件，可选“mouseclick”、“mouseover”，默认为“mouseclick”
        },

        //初始化
        initialize: function(options) {
            L.setOptions(this, options);
            this._popupLayer = L.popup()

            loadStyleString(".leaflet-popup-content-wrapper { padding: 1px; text-align: left; border-radius: 1px; }");
            loadStyleString(".popupListLayer-wrapper { position: relative; min-width: 100px; background-color: #fff; }");
            loadStyleString(".popupListLayer-wrapper .popupListLayer-title { position: absolute; top: -20px; left: -15px; height: 40px; line-height: 40px; }");
            loadStyleString(".popupListLayer-wrapper .popupListLayer-title p { font-size: 15px; color: #4b4848; cursor: pointer; display: inline-block; vertical-align: middle; margin: -5px 0 0 0; }");
            loadStyleString(".popupListLayer-wrapper .popupListLayer-title p i { display: inline-block; vertical-align: middle; margin: 0 3px; line-height: 20px; font-size: 15px; }");
            loadStyleString(".popupListLayer-wrapper .popupListLayer-title .icon { cursor: pointer; display: inline-block; vertical-align: middle; }");

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
        },

        mouseEventFun: function(evt) {
            var markerList = []
            var contentHTML = ''
            var poplistsIndex = 1;
            this.allMarkerList.forEach(makerItem => {
                if (makerItem.getLatLng().lat === evt.target.getLatLng().lat && makerItem.getLatLng().lng === evt.target.getLatLng().lng) {
                    markerList.push(makerItem);
                }
            });
            var leftArrowSvg = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3702" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="12px"> <defs> <style type="text/css"> </style> </defs> <path d="M212.3652 511.991814 212.25366 511.87925 723.283566 0.843204 811.754526 89.313142 389.068691 511.998977 811.75555 934.685835 723.283566 1023.154749 212.24445 512.11154Z" p-id="3703"> </path> </svg>'
            var rightArrowSvg = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1765" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="12px"> <defs> <style type="text/css"> </style> </defs> <path d="M321.499429 990.025143L225.828571 905.398857l393.325715-392.192L230.948571 123.867429 319.780571 34.669714 798.464 513.097143 321.499429 990.025143z" p-id="1766"></path> </svg>'
            if (markerList.length > 1) {
                // 气泡内容
                contentHTML =
                    `<div class="popupListLayer-wrapper">
                        <div class="popupListLayer-title">
                            <div class="icon" onclick="leftArrowClick()">${leftArrowSvg}</div>
                            <p><i id="popupListLayer-index">1</i>/<i>${markerList.length}</i></p>
                            <div class="icon" onclick="rightArrowClick()">${rightArrowSvg}</div>
                        </div>
                        <div id="popupListLayer-content" style="padding-top: 15px;">${markerList[0].options.contentHTML}</div>
                    </div>`
            } else {
                contentHTML = evt.target.options.contentHTML
            }

            this._popupLayer.setLatLng(evt.target.getLatLng())
                .setContent(contentHTML)
                .openOn(map);
            // 向左切换
            window.leftArrowClick = function() {
                poplistsIndex = poplistsIndex-- === 1 ? 1 : poplistsIndex--
                document.getElementById('popupListLayer-index').innerHTML = poplistsIndex
                document.getElementById('popupListLayer-content').innerHTML = markerList[poplistsIndex - 1].options.contentHTML
            }
            // 向右切换
            window.rightArrowClick = function() {
                poplistsIndex = poplistsIndex++ < markerList.length ? poplistsIndex++ : markerList.length
                document.getElementById('popupListLayer-index').innerHTML = poplistsIndex
                document.getElementById('popupListLayer-content').innerHTML = markerList[poplistsIndex - 1].options.contentHTML
            }
        },

        // 清除
        clear: function() {
            this._popupLayer.remove()
        }
    });

    L.popupListLayer = function(options) {
        return new PopupListLayer(options);
    };
}, window));