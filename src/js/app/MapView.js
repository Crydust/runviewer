/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['./Converter', 'lodash', 'gm'], function(Converter, _, gmaps) {

    'use strict';

    function convertTrackPointToLatLng(point) {
        return new gmaps.LatLng(point.getLat(), point.getLng());
    }
    function convertTrackToLatLngArray(track) {
        return _.map(track.getPoints(), function(point) {
            return convertTrackPointToLatLng(point);
        });
    }
    function convertTrackToLatLngBounds(track) {
        var latlngbounds = new gmaps.LatLngBounds();
        _.each(track.getPoints(), function(point) {
                latlngbounds.extend(convertTrackPointToLatLng(point));
            });
        return latlngbounds;
    }

    function MapView(id, track){
    
        var center = convertTrackPointToLatLng(track.getCenter());
        var colors = _.map(track.getSpeeds(), Converter.convertSpeedToColor);
        var coordinates = convertTrackToLatLngArray(track);
        var distances = track.getDistances();
        var times = track.getTimes();
        var latLngBounds = convertTrackToLatLngBounds(track);
    
        var rectangle = new gmaps.Rectangle();
        
        // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
        this.map = new gmaps.Map(document.getElementById(id), {
                zoom: 13,
                center: center,
                mapTypeId: gmaps.MapTypeId.ROADMAP,
                //disableDefaultUI: true,
                styles: [{
                    featureType: 'poi',
                    stylers: [{ visibility: 'off' }]
                }, {
                    featureType: 'administrative',
                    stylers: [{ visibility: 'off' }]
                }, {
                    featureType: 'landscape',
                    stylers: [{ visibility: 'off' }]
                }, {
                    featureType: 'transit',
                    stylers: [{ visibility: 'off' }]
                }]
            });

        this.map.fitBounds(latLngBounds);

        gmaps.event.addListenerOnce(this.map, 'idle', 
            _.bind(this.drawTrack, this, rectangle, colors, coordinates));
        gmaps.event.addListenerOnce(this.map, 'idle', 
            _.bind(this.drawMarkers, this, coordinates, distances, times));
        gmaps.event.addListener(this.map, 'bounds_changed',
            _.debounce(
                _.bind(this.updateRectangleBounds, this, rectangle), 
            50));
    }

    MapView.prototype.drawTrack = function(rectangle, colors, coordinates) {
        var currentColor = colors[1];
        var previousPoint = coordinates[0];

        var currentColorPoints = [];
        var i, len, currentPoint;
        currentColorPoints.push(previousPoint);

        rectangle.setOptions({
            'strokeColor': '#000000',
            'strokeOpacity': 0,
            'strokeWeight': 0,
            'fillColor': '#000000',
            'fillOpacity': 0.7,
            'map': this.map,
            'bounds': this.map.getBounds()
        });

        for (i = 1, len = colors.length; i < len; i += 1) {
            currentPoint = coordinates[i];
            currentColorPoints.push(currentPoint);
            if (colors[i] !== currentColor || i === len - 1) {
                var polyline = new gmaps.Polyline({
                    'path': currentColorPoints,
                    'strokeColor': currentColor,
                    'strokeOpacity': 1,
                    'strokeWeight': 5,
                    'map': this.map
                });

                currentColor = colors[i];
                currentColorPoints = [];
                currentColorPoints.push(currentPoint);
            }
        }
    };

    MapView.prototype.drawMarkers = function(coordinates, distances, times) {
        var km = 0;
        var startIcon = new gmaps.Marker({
            'position': coordinates[0],
            'map': this.map,
            'icon': {url: 'http://chart.googleapis.com/chart?' +
                    'chst=d_map_pin_letter&chld=A|69C24C|000000'}
        });
        var endIcon = new gmaps.Marker({
            'position': _.last(coordinates),
            'map': this.map,
            'icon': {url: 'http://chart.googleapis.com/chart?' +
                    'chst=d_map_pin_letter&chld=B|69C24C|000000'}
        });
        var endInfoWindow = new gmaps.InfoWindow({
            'content': 'Distance: ' +
                    (_.last(distances) / 1000).toFixed(2) +
                    ' km<br />Time: ' +
                    Converter.secondsToLegible(_.last(times))
        });
        gmaps.event.addListener(endIcon, 'click', function() {
            endInfoWindow.open(this.map, this);
        });
        var that = this;
        _.each(distances, function(element, index, list) {
            var currentKm = Math.floor(element / 1000);
            if (currentKm > km) {
                km = currentKm;
                var time = times[index];

                // icon: {url: 'http://chart.googleapis.com/chart' +
                // '?chst=d_map_pin_letter&chld=' + km  +
                // '|CCCCCC|000000'}
                var kmIcon = new gmaps.Marker({
                    'position': coordinates[index],
                    'map': that.map,
                    'icon': {
                        'path': gmaps.SymbolPath.CIRCLE,
                        'scale': 3
                    }
                });
                var kmInfoWindow = new gmaps.InfoWindow({
                    'content': 'Distance: ' + km + ' km<br />Time: ' +
                            Converter.secondsToLegible(time)
                });
                gmaps.event.addListener(kmIcon, 'click', function() {
                    kmInfoWindow.open(that.map, this);
                });
            }
        });
    };

    MapView.prototype.updateRectangleBounds = function(rectangle) {
        rectangle.setBounds(this.map.getBounds());
    };
    
    
    return MapView;
});
