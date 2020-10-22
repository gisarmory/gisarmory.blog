L.LayerGroup.include({
    // 隐藏
    hideLayer: function() {
        this.eachLayer(function(itemLayer) {
            // 记录默认时opacity值，以便显示时样式一致
            if(itemLayer.options.opacity){
                itemLayer.options.opacityBefore = itemLayer.options.opacity
            } else if(!itemLayer.options.opacityBefore){
                itemLayer.options.opacityBefore = 1
            }
            if(itemLayer.options.fillOpacity){
                itemLayer.options.fillOpacityBefore = itemLayer.options.fillOpacity
            } else if(!itemLayer.options.fillOpacityBefore) {
                itemLayer.options.fillOpacityBefore = 1
            }
  
            if (itemLayer._icon) {
                itemLayer.setOpacity(0)
            } else {
                itemLayer.setStyle({
                    opacity: 0,
                    fillOpacity: 0
                })
            }
        })
    },
    // 显示
    showLayer: function() {
        this.eachLayer(function(itemLayer) {
            if(itemLayer.options.opacity || itemLayer.options.fillOpacity){
                return
            }
            if (itemLayer._icon) {
                itemLayer.setOpacity(itemLayer.options.opacityBefore)
            } else {
                itemLayer.setStyle({
                    opacity: itemLayer.options.opacityBefore,
                    fillOpacity: itemLayer.options.fillOpacityBefore
                })
            }
        })
    }
  });