L.LayerGroup.include({
    /**
     * 隐藏，2020年09月17日，xuyf
     */
    hideLayer: function() {
        this.eachLayer(function(itemLayer) {
            if (itemLayer._icon) {
                itemLayer.setOpacity(0)
            } else {
                if(itemLayer.options.opacity){
                    itemLayer.options.opacityBefore = itemLayer.options.opacity
                } else {
                    itemLayer.options.opacityBefore = 1
                }
                if(itemLayer.options.fillOpacity){
                    itemLayer.options.fillOpacityBefore = itemLayer.options.fillOpacity
                } else {
                    itemLayer.options.fillOpacityBefore = 1
                }
                itemLayer.setStyle({
                    opacity: 0,
                    fillOpacity: 0
                })
            }
        })
    },
    /**
     * 显示，2020年09月17日，xuyf
     */
    showLayer: function() {
        this.eachLayer(function(itemLayer) {
            if (itemLayer._icon) {
                itemLayer.setOpacity(1)
            } else {
                if(itemLayer.options.opacity || itemLayer.options.fillOpacity){
                    return
                }
                itemLayer.setStyle({
                    opacity: itemLayer.options.opacityBefore,
                    fillOpacity: itemLayer.options.fillOpacityBefore
                })
            }
        })
    }
});