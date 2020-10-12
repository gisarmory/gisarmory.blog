// @class PolyLine

L.Path.mergeOptions({
    // @option dashSpeed: Number
    // The speed of the dash array, in pixels per second
    dashSpeed: 0
});


var _originalBeforeAdd = L.Path.prototype.beforeAdd;

L.Path.include({

    beforeAdd: function(map) {
        _originalBeforeAdd.bind(this)(map);

        if (this.options.dashSpeed) {
            this._lastDashFrame = performance.now();
            this._dashFrame = L.Util.requestAnimFrame(this._onDashFrame.bind(this));
        }
    },

    _onDashFrame: function() {
        if (!this._renderer) {
            return;
        }

        var now = performance.now();
        var dashOffsetDelta = (now - this._lastDashFrame) * this.options.dashSpeed / 1000;

        this.options.dashOffset = Number(this.options.dashOffset || 0) + dashOffsetDelta;
        this._renderer._updateStyle(this);

        this._lastDashFrame = performance.now();

        this._dashFrame = L.Util.requestAnimFrame(this._onDashFrame.bind(this));
    },

    _offDashFrame: function() {
        L.Util.cancelAnimFrame(this._dashFrame);
    },

    onRemove: function() {
        this._renderer._removePath(this);
        this._offDashFrame();
    }
});


// 针对Canvas添加dashOffset参数，解决Canvas下无法实现动态线问题
L.Canvas.include({
    _updateDashArray: function(layer) {
        if (typeof layer.options.dashArray === 'string') {
            var parts = layer.options.dashArray.split(/[, ]+/),
                dashArray = [],
                dashValue,
                i;
            for (i = 0; i < parts.length; i++) {
                dashValue = Number(parts[i]);
                // Ignore dash array containing invalid lengths
                if (isNaN(dashValue)) {
                    return;
                }
                dashArray.push(dashValue);
            }
            layer.options._dashArray = dashArray;
        } else {
            layer.options._dashArray = layer.options.dashArray;
        }

        if (layer.options.dashOffset) {
            layer.options._dashOffset = layer.options.dashOffset;
        }
    },
    _fillStroke: function(ctx, layer) {
        var options = layer.options;

        if (options.fill) {
            ctx.globalAlpha = options.fillOpacity;
            ctx.fillStyle = options.fillColor || options.color;
            ctx.fill(options.fillRule || 'evenodd');
        }

        if (options.stroke && options.weight !== 0) {
            if (ctx.setLineDash) {
                ctx.setLineDash(layer.options && layer.options._dashArray || []);
            }
            if (layer.options._dashOffset) {
                ctx.lineDashOffset = layer.options._dashOffset;
            }
            ctx.globalAlpha = options.opacity;
            ctx.lineWidth = options.weight;
            ctx.strokeStyle = options.color;
            ctx.lineCap = options.lineCap;
            ctx.lineJoin = options.lineJoin;
            ctx.stroke();
        }
    },
})