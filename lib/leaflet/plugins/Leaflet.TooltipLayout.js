(function(factory, window) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }
    if (typeof window !== 'undefined' && window.L) {
        window.L.tooltipLayout = factory(L);
    }
})(function(L) {
    var TooltipLayout = {};

    // global variables
    var map;
    var markerList = []; // all markers here
    var polylineList = []; // all polylines here

    // events
    var _onPolylineCreated = null; // will be called after polyline has been created

    // 清除
    function tooltipClear() {
        if (markerList.length > 0) {
            markerList.forEach(element => {
                element.unbindTooltip();
            });

            markerList = []
            removeAllPolyline(map)
        }
    }

    function initialize(leafletMap, onPolylineCreated) {
        map = leafletMap;
        // markerList = [];
        polylineList = [];

        //default style
        if (onPolylineCreated) {
            _onPolylineCreated = onPolylineCreated;
        } else {
            _onPolylineCreated = ply => {
                ply.setStyle({
                    color: '#90A4AE'
                });
            };
        }

        redrawLines(true);

        // event registrations
        map.on('zoomstart', function() {
            removeAllPolyline(map);
        });

        map.on('zoomend', function() {
            redrawLines(true);
        });

        map.on('dragend', function() {
            redrawLines();
        });

        map.on('resize', function() {
            redrawLines();
        });
    }

    function redrawLines(maintainAllPolyline) {
        if (!maintainAllPolyline) {
            removeAllPolyline(map);
        }
        setRandomPos(map);
        layoutByForce();
        setEdgePosition();
        drawLine(map);
    }

    function addMarker(marker) {
        markerList.push(marker)
    }

    function deleteMarker(marker) {
        let i = markerList.indexOf(marker);
        if (i !== -1) {
            markerList.splice(i, 1)
        }
    }

    function resetMarker(marker) {
        var name = marker.getTooltip().getContent();
        var options = marker.getTooltip().options;
        marker.unbindTooltip();

        marker.bindTooltip(name, {
            pane: options.pane,
            offset: options.offset,
            className: options.className,
            permanent: true,
            interactive: true,
            direction: 'left',
            sticky: 'none',
            opacity: options.opacity
        });
        markerList.push(marker);
    }

    function getMarkers() {
        return markerList;
    }

    function setMarkers(arr) {
        markerList = arr;
    }

    function getLine(marker) {
        return marker.__ply;
    }

    function removeAllPolyline(map) {
        var i;
        for (i = 0; i < polylineList.length; i++) {
            map.removeLayer(polylineList[i]);
        }
        polylineList = [];
    }

    /**
     * Draw lines between markers and tooltips
     * @param map leaflet map
     */
    function drawLine(map) {
        removeAllPolyline(map);
        for (var i = 0; i < markerList.length; i++) {
            var marker = markerList[i];
            var markerDom = marker._icon;
            var markerPosition = getPosition(markerDom);
            var label = marker.getTooltip();

            var labelDom = label._container;
            var labelPosition = getPosition(labelDom);

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
                var destLatLng = map.layerPointToLatLng(lineDest);

                setTimeout(
                    ((marker, destLatLng) => () => {
                        let ply = L.polyline([marker.getLatLng(), destLatLng]);
                        _onPolylineCreated && _onPolylineCreated(ply);
                        marker.__ply = ply;
                        polylineList.push(ply);
                        ply.addTo(map);
                    })(marker, destLatLng),
                    0
                );
            }
        }
    }

    function setRandomPos() {
        for (var i = 0; i < markerList.length; i++) {
            var marker = markerList[i];
            var label = marker.getTooltip();
            var labelDom = label._container;
            var markerDom = marker._icon;
            var markerPosition = getPosition(markerDom);
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
    }

    function scaleTo(a, b) {
        return L.point(a.x * b.x, a.y * b.y);
    }

    function normalize(a) {
        var l = a.distanceTo(L.point(0, 0));
        if (l === 0) {
            return a;
        }
        return L.point(a.x / l, a.y / l);
    }

    function fa(x, k) {
        return (x * x) / k;
    }

    function fr(x, k) {
        return (k * k) / x;
    }

    /**
     * get position form el.style.transform
     */
    function getPosition(el) {
        var translateString = el.style.transform
            .split('(')[1]
            .split(')')[0]
            .split(',');
        return L.point(parseInt(translateString[0]), parseInt(translateString[1]));
    }

    /**
     * t is the temperature in the system
     */
    function computePositionStep(t) {
        var area = (window.innerWidth * window.innerHeight) / 10;
        var k = Math.sqrt(area / markerList.length);
        var dpos = L.point(0, 0);
        var v_pos;
        var v;
        var i;

        for (i = 0; i < markerList.length; i++) {
            v = markerList[i];
            // get position of label v
            v.disp = L.point(0, 0);
            v_pos = getPosition(v.getTooltip()._container);

            // compute gravitational force
            for (var j = 0; j < markerList.length; j++) {
                var u = markerList[j];
                if (i !== j) {
                    var u_pos = getPosition(u.getTooltip()._container);
                    dpos = v_pos.subtract(u_pos);
                    if (dpos !== 0) {
                        v.disp = v.disp.add(
                            normalize(dpos).multiplyBy(fr(dpos.distanceTo(L.point(0, 0)), k))
                        );
                    }
                }
            }
        }

        // compute force between marker and tooltip
        for (i = 0; i < markerList.length; i++) {
            v = markerList[i];
            v_pos = getPosition(v.getTooltip()._container);
            dpos = v_pos.subtract(getPosition(v._icon));
            v.disp = v.disp.subtract(
                normalize(dpos).multiplyBy(fa(dpos.distanceTo(L.point(0, 0)), k))
            );
        }

        // calculate layout
        for (i = 0; i < markerList.length; i++) {
            var disp = markerList[i].disp;
            var p = getPosition(markerList[i].getTooltip()._container);
            var d = scaleTo(
                normalize(disp),
                L.point(Math.min(Math.abs(disp.x), t), Math.min(Math.abs(disp.y), t))
            );
            p = p.add(d);
            p = L.point(Math.ceil(p.x), Math.ceil(p.y));
            L.DomUtil.setTransform(markerList[i].getTooltip()._container, p);
        }
    }

    function layoutByForce() {
        var start = Math.ceil(window.innerWidth / 10);
        var times = 50;
        var t;
        for (var i = 0; i < times; i += 1) {
            t = start * (1 - i / (times - 1));
            computePositionStep(t);
        }

        for (i = 0; i < markerList.length; i++) {
            var disp = markerList[i].disp;
            var p = getPosition(markerList[i].getTooltip()._container);
            var width = markerList[i].getTooltip()._container.offsetWidth;
            var height = markerList[i].getTooltip()._container.offsetHeight;
            p = L.point(Math.ceil(p.x - width / 2), Math.ceil(p.y - height / 2));
            L.DomUtil.setTransform(markerList[i].getTooltip()._container, p);
        }
    }

    function setEdgePosition() {
        var bounds = map.getBounds();
        var northWest = map.latLngToLayerPoint(bounds.getNorthWest());
        var southEast = map.latLngToLayerPoint(bounds.getSouthEast());

        for (let i = 0; i < markerList.length; i++) {
            var tooltip = getPosition(markerList[i].getTooltip()._container);
            var marker = getPosition(markerList[i]._icon);
            var width = markerList[i].getTooltip()._container.offsetWidth;
            var height = markerList[i].getTooltip()._container.offsetHeight;

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

            L.DomUtil.setTransform(markerList[i].getTooltip()._container, tooltip);
        }
    }

    TooltipLayout['tooltipClear'] = tooltipClear;
    TooltipLayout['initialize'] = initialize;
    TooltipLayout['redrawLines'] = redrawLines;
    TooltipLayout['resetMarker'] = resetMarker;
    TooltipLayout['getMarkers'] = getMarkers;
    TooltipLayout['setMarkers'] = setMarkers;
    TooltipLayout['addMarker'] = addMarker;
    TooltipLayout['deleteMarker'] = deleteMarker;
    TooltipLayout['getLine'] = getLine;
    TooltipLayout['removeAllPolyline'] = removeAllPolyline;

    return TooltipLayout;
}, window);