
var speed_southWest = L.latLng(1.20,103.55),
speed_northEast = L.latLng(1.51,104.05),
speed_latcoord = 1.36,
speed_loncoord = 103.82;

var speed_map = L.map('speed_map', {
    center: L.latLng(speed_latcoord, speed_loncoord),
    zoom: 12,
    maxBounds: L.latLngBounds(speed_southWest, speed_northEast),
    zoomControl:false
});

speed_map.options.maxZoom = 16;
speed_map.options.minZoom = 12;

L.tileLayer.provider('CartoDB.Positron')  //'CartoDB.DarkMatter'CartoDB.Positron,CartoDB.PositronNoLabels
    .addTo(speed_map);

var base_polygon = L.polygon([
    [2.0, 100],
    [2.0, 106],
    [0, 106],
    [0, 100]],
    {
        color: 'white',
        fillColor: 'white',
        fillOpacity: 0.7
}).addTo(speed_map);


var speed_bins = [10,20,30,40]
var speed_bins_labels = ["0 - 10 Mbps","10 - 20 Mbps","20 - 30 Mbps",">30 Mbps"]
// get color for grid
function speed_getColor(speed) {
    switch   (true) {
        case speed <= speed_bins[0] :    return "#ece7f2";
        case speed <= speed_bins[1] :    return "#a6bddb";
        case speed <= speed_bins[2] :    return "#3690c0";
        default:              return "#023858";
    }
}

// control that shows grid info on hover
var speed_info = L.control({position:'bottomright'});

speed_info.onAdd = function (speed_map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

speed_info.update = function (props) {
    var speed_info_text = ""
    for (i in speed_bins) {
        speed_info_text = speed_info_text+'<j style="background:'+speed_getColor(speed_bins[i])+'"></j>'+speed_bins_labels[i]+'<br/>'
    }

    this._div.innerHTML = speed_info_text
};

speed_info.addTo(speed_map);

function speed_style(feature) {
        return {
        fillColor: speed_getColor(feature.properties.perc_disc_50),
        weight: 0,
        opacity: 0.5,
        color: 'black',
        fillOpacity: 0.5
    };
}

var speed_lastClickedLayer
var speed_current_polygon

function speed_highlightFeature(e) {
    if(speed_lastClickedLayer){
       geojson.resetStyle(speed_lastClickedLayer);
    }

    speed_map.fitBounds(e.target.getBounds());
    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: '#cccccc',
        dashArray: '',
        fillOpacity: 0.3
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    speed_info.update(JSON.parse(layer.feature.properties.network_performance).sort(function(a,b){return parseFloat(b.perc_disc_50) - parseFloat(a.perc_disc_50);}));
    speed_lastClickedLayer = layer;
    }

var speed_geojson;


speed_geojson = L.geoJson(speed_data_layer,{
    style: speed_style,
    clickable: false
}).addTo(speed_map);

speed_map.locate({setView: true, maxZoom: 12});

var current_marker
var current_circle

function speed_onLocationFound(e) {
    var radius = e.accuracy / 2;
    var speed_result_polygon;

    speed_current_marker = L.marker(e.latlng).addTo(speed_map);

    speed_map.fitBounds(speed_current_marker);
};

map.on('locationfound', speed_onLocationFound);
