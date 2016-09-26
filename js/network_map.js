
//Setting origin and bounds for map
var southWest = L.latLng(1.20,103.55),
northEast = L.latLng(1.51,104.05),
latcoord = 1.36,
loncoord = 103.82;

var map = L.map('network_map', {
    center: L.latLng(latcoord, loncoord),
    zoom: 12,
    maxBounds: L.latLngBounds(southWest, northEast)
});

map.options.maxZoom = 16;
map.options.minZoom = 12;

//Set map layer
L.tileLayer.provider('CartoDB.Positron')
    .addTo(map);

// add network info card to bottom right hand corner of map
var network_info = L.control({position:'bottomright'});

network_info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

function findby_key_value(key,dict_arr) {
    for (i in dict_arr) {
        if (dict_arr[i]['network']===key){
            return true;
        }
    }
    return false;
}

// function to update network info
network_info.update = function (props) {
    if (props){
        network_performance = [{'network':'Singtel','perc_disc_50':'Data Not Available'},{'network':'StarHub','perc_disc_50':'Data Not Available'},{'network':'M1','perc_disc_50':'Data Not Available'}]
        if (props.length != 3) {
            for (j in network_performance) {
                if (!findby_key_value(network_performance[j]['network'],props)){
                    props.push(network_performance[j])
                }
            }
        }

        info_text  = ""
        for (i in props) {
            if (typeof(props[i]['perc_disc_50'])=='string') {
               info_text = info_text+'<i style="background:'+getColor(props[i]['network'],1)+'"></i>'+'<font color="grey"><b>'+props[i]['network']+'</b><br/>'+props[i]['perc_disc_50']+'</font><br/>'
            }
            else {
                info_text = info_text+'<i style="background:'+getColor(props[i]['network'],1)+'"></i>'+'<b>'+props[i]['network']+'</b><br/>'+(Math.round(props[i]['perc_disc_50']*100)/100).toLocaleString()+' Mbps (Count: '+(Math.round(props[i]['count']*100)/100).toLocaleString()+')<br/>'
            }
                }
        this._div.innerHTML = (props ?
            info_text
            : 'Click on a grid'
                );
    }
};

network_info.addTo(map);

// set colour of network
function getColor(network) {
    switch   (network) {
            case 'Singtel': return "#fc8d62";
            case 'M1':      return "#8da0cb";
            case 'StarHub': return "#66c2a5";
            default:        return "white";
        }
}

//get max value based on key value network pair (based on average_received_maximum_bps)
function getMax(i) {
    var max = 0;
    var max_key = "";
    var result = JSON.parse(i.network_performance)

    for (var i in result) {
        if (result[i].perc_disc_50 > max) {
            max = result[i].perc_disc_50;
            max_key = result[i].network;
        }
    }
    return max_key

}

// styling for each grid
function style(feature) {
    return {
        fillColor: getColor(getMax(feature.properties)),
        weight: 0,
        opacity: 0.8,
        color: 'black',
        fillOpacity: 0.8
    };
}

//initialize global variables for current and previous grid selected
var lastClickedLayer
var current_polygon

//styling for selected grid
function highlightFeature(e) {
    if(lastClickedLayer){
       geojson.resetStyle(lastClickedLayer);
    }

    map.fitBounds(e.target.getBounds());
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

    network_info.update(JSON.parse(layer.feature.properties.network_performance).sort(function(a,b){return parseFloat(b.perc_disc_50) - parseFloat(a.perc_disc_50);}));
    lastClickedLayer = layer;
}

//adding grid layer into map
var geojson;

function resetHighlight(e) {
        geojson.resetStyle(e.target);
        network_info.update();
    }

function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

function onEachFeature(feature, layer) {
        layer.on({
            click: highlightFeature
        });
    }

geojson = L.geoJson(data_layer,{
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

var curr_loc_marker = L.icon({
    iconUrl: 'img/point.png',

    iconSize:     [12, 12], // size of the icon
    iconAnchor:   [6, 6], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});

var current_marker
var current_circle

map.locate({setView: true, maxZoom: 16});

//select grid in current location
function onLocationFound(e) {
    var radius = e.accuracy / 2;
    var result_polygon;

    current_marker = L.marker(e.latlng).addTo(map);
    current_circle = L.circle(e.latlng,radius).addTo(map);

    result_polygon = leafletPip.pointInLayer(e.latlng, geojson);
    current_polygon = result_polygon[0];
    map.fitBounds(current_polygon.getBounds());

    if (current_polygon != undefined) {
        if(lastClickedLayer){
           geojson.resetStyle(lastClickedLayer);
        }

        map.fitBounds(current_polygon.getBounds());
        var layer = current_polygon;
        layer.setStyle({
            weight: 2,
            color: '#cccccc',
            dashArray: '',
            fillOpacity: 0.3
        });

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }

        network_info.update(JSON.parse(layer.feature.properties.network_performance).sort(function(a,b){return parseFloat(b.perc_disc_50) - parseFloat(a.perc_disc_50);}));
        lastClickedLayer = layer;
    } else {network_info._div.innerHTML = '<center>Select a grid</center>';}
};

map.on('locationfound', onLocationFound);

function onLocationError(e) {
    network_info._div.innerHTML = '<center>Select a grid</center>';
}

map.on('locationerror', onLocationError);

var geocoder = L.Control.geocoder({
    collapsed:false
}).addTo(map);

geocoder.markGeocode = function(result) {
    var result_polygon;
    this._map.fitBounds(result.bbox);

    if (current_marker) {
        this._map.removeLayer(current_marker);
        this._map.removeLayer(current_circle);
    }

    if (this._geocodeMarker) {
        this._map.removeLayer(this._geocodeMarker);
    }

    this._geocodeMarker = new L.Marker(result.center)
        .addTo(this._map);

    result_polygon = leafletPip.pointInLayer(result.center, geojson);
    current_polygon = result_polygon[0];

    if (current_polygon != undefined) {
            if(lastClickedLayer){
               geojson.resetStyle(lastClickedLayer);
            }

            map.fitBounds(current_polygon.getBounds());
            var layer = current_polygon;
            layer.setStyle({
                weight: 2,
                color: '#cccccc',
                dashArray: '',
                fillOpacity: 0.3
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }

            network_info.update(JSON.parse(layer.feature.properties.network_performance).sort(function(a,b){return parseFloat(b.perc_disc_50) - parseFloat(a.perc_disc_50);}));
            lastClickedLayer = layer;
            //highlightFeature(current_polygon.feature);
        } else {network_info._div.innerHTML = '<center>Select a grid</center>';}
    return this;
}
