/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false, window:false, XMLHttpRequest: false,
ActiveXObject: false, DOMParser: false */

// IE 6: map doesn't show, works in IE 7

define(['./Promise', './MathHelper', './Track', 'lodash', 'gm', 'domReady!'],
       function(Promise, MathHelper, Track, _, gmaps, document) {

    'use strict';

    var NOOP = function() {};

    function fetchTextAsync(url) {
        var promise = new Promise();
        var xhr = XMLHttpRequest ?
            new XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP.3.0');
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType('text/plain; charset=UTF-8');
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    promise.resolve(xhr.responseText);
                } else {
                    promise.reject(null);
                }
            }
        };
        xhr.open('GET', url, true);
        xhr.send(null);
        return promise;
    }

    function loadXml(url) {
        var promise = new Promise();
        fetchTextAsync(url).then(function(responseText) {
            // xml is invalid sometimes
            if (responseText.indexOf('</trkseg>') === -1) {
                responseText = responseText.replace(
                        '</trk>', '</trkseg></trk>');
            }
            var xml;
            if (DOMParser) {
                xml = (new DOMParser()).parseFromString(
                        responseText, 'text/xml');
            } else {
                xml = new ActiveXObject('Microsoft.XMLDOM');
                xml.async = false;
                xml.loadXML(responseText);
            }
            promise.resolve(xml);
        });
        return promise;
    }

    function msToKmh(ms) {
        return ms * 3.6;
    }

    function padLeft(s, length, chr) {
        var result = String(s);
        while (result.length < length) {
            result = chr + result;
        }
        return String(result);
    }

    function secondsToLegible(s) {
        var hours = Math.floor(s / 3600);
        var minutes = Math.floor((s - hours * 3600) / 60);
        var seconds = Math.floor((s - hours * 3600 - minutes * 60));
        var result = '%dm %ds';
        if (hours > 0) {
            result = '%dh %dm %ds';
            result = result.replace('%d', padLeft(hours, 2, '0'));
        }
        return result
            .replace('%d', padLeft(minutes, 2, '0'))
            .replace('%d', padLeft(seconds, 2, '0'));
    }

    function epochToDateString(epoch_s) {
        var date = new Date();
        date.setTime(epoch_s * 1000);
        return '%d/%d/%d'
            .replace('%d', padLeft(date.getDate(), 2, '0'))
            .replace('%d', padLeft(date.getMonth() + 1, 2, '0'))
            .replace('%d', padLeft(date.getFullYear(), 2, '0'));
    }
    function epochToTimeString(epoch_s) {
        var date = new Date();
        date.setTime(epoch_s * 1000);
        return '%d:%d'
            .replace('%d', padLeft(date.getHours(), 2, '0'))
            .replace('%d', padLeft(date.getMinutes(), 2, '0'));
    }

    function randomFromInterval(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    function speedToColor(speed) {
        var kmh = msToKmh(speed);
        var colors = ['#BB2222',
        //'#BB3522', '#BB4822', '#BB5B22',
        '#BB6E22',
        //'#BB8222', '#BB9522', '#BBA822',
        '#BBBB22',
        //'#A8BB22', '#95BB22', '#82BB22',
        '#6EBB22',
        //'#5BBB22', '#48BB22', '#35BB22',
        '#22BB22'];
        var minspeed = 5;
        var maxspeed = 12;
        var index = Math.round((colors.length - 1) *
                Math.min(1.0,
                Math.max(0.0, (kmh - minspeed) / (maxspeed - minspeed))));
        return colors[index];
    }

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

    function initialize() {
        var urls = [
                //'RK_gpx _2012-07-01_2045.gpx',
                //'RK_gpx _2012-07-06_1254.gpx',
                //'RK_gpx _2012-07-06_1334.gpx',
                //'RK_gpx _2012-07-06_2229.gpx',
                //'RK_gpx _2012-07-09_2104.gpx',
                //'RK_gpx _2012-07-11_2122.gpx',
                //'RK_gpx _2012-07-13_2230.gpx', //NaN?
                //'RK_gpx _2012-07-24_2233.gpx',
                //'RK_gpx _2012-07-29_2030.gpx',
                //'RK_gpx _2012-08-05_2023.gpx',
                //'RK_gpx _2012-08-07_1847.gpx',
                'RK_gpx _2012-08-09_2201.gpx' // start is bumpy
            ];

        var url = urls[randomFromInterval(0, urls.length - 1)];

        loadXml(url).then(function(xml) {

            var track = Track.loadFromXml(xml);
            track = track.toTrackWithoutOutliers();
            track = track.toTrackWithSgFilter();

            var center = convertTrackPointToLatLng(track.getCenter());
            var colors = _.map(track.getSpeeds(), speedToColor);
            var coordinates = convertTrackToLatLngArray(track);
            var distances = track.getDistances();
            var times = track.getTimes();
            var latLngBounds = convertTrackToLatLngBounds(track);

            _.each({
                'date': epochToDateString(track.getDate()),
                'starttime': epochToTimeString(track.getStartTime()),
                'endtime': epochToTimeString(track.getEndTime()),
                'distance': (track.getTotalDistance() / 1000).toFixed(2) +
                        ' km',
                'duration': secondsToLegible(track.getTotalTime()),
                'avgpace': secondsToLegible(track.getAveragePace()) + ' /km',
                'avgspeed': msToKmh(track.getAverageSpeed()).toFixed(2) +
                        ' km/h'
            }, function(value, key, list) {
                document.getElementById(key).innerHTML = value;
            });

            // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
            var map = new gmaps.Map(document.getElementById('map_canvas'), {
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

            map.fitBounds(latLngBounds);

            var rectangle = new gmaps.Rectangle();

            function drawTrack() {
                var currentColor = colors[1];
                var previousPoint = coordinates[0];

                var currentColorPoints = [];
                var i, len, currentPoint;
                currentColorPoints.push(previousPoint);

                rectangle.setOptions({
                    strokeColor: '#000000',
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: '#000000',
                    fillOpacity: 0.7,
                    map: map,
                    bounds: map.getBounds()
                });

                for (i = 1, len = colors.length; i < len; i += 1) {
                    currentPoint = coordinates[i];
                    currentColorPoints.push(currentPoint);
                    if (colors[i] !== currentColor || i === len - 1) {
                        var polyline = new gmaps.Polyline({
                            path: currentColorPoints,
                            strokeColor: currentColor,
                            strokeOpacity: 1,
                            strokeWeight: 5,
                            map: map
                        });

                        currentColor = colors[i];
                        currentColorPoints = [];
                        currentColorPoints.push(currentPoint);
                    }
                }
            }

            function drawMarkers() {
                var km = 0;
                var startIcon = new gmaps.Marker({
                    position: coordinates[0],
                    map: map,
                    icon: {url: 'http://chart.googleapis.com/chart?' +
                            'chst=d_map_pin_letter&chld=A|69C24C|000000'}
                });
                var endIcon = new gmaps.Marker({
                    position: _.last(coordinates),
                    map: map,
                    icon: {url: 'http://chart.googleapis.com/chart?' +
                            'chst=d_map_pin_letter&chld=B|69C24C|000000'}
                });
                var endInfoWindow = new gmaps.InfoWindow({
                    content: 'Distance: ' +
                            (_.last(distances) / 1000).toFixed(2) +
                            ' km<br />Time: ' +
                            secondsToLegible(_.last(times))
                });
                gmaps.event.addListener(endIcon, 'click', function() {
                    endInfoWindow.open(map, this);
                });
                _.each(distances, function(element, index, list) {
                    var currentKm = Math.floor(element / 1000);
                    if (currentKm > km) {
                        km = currentKm;
                        var time = times[index];

                        // icon: {url: 'http://chart.googleapis.com/chart' +
                        // '?chst=d_map_pin_letter&chld=' + km  +
                        // '|CCCCCC|000000'}
                        var kmIcon = new gmaps.Marker({
                            position: coordinates[index],
                            map: map,
                            icon: {
                                path: gmaps.SymbolPath.CIRCLE,
                                scale: 3
                            }
                        });
                        var kmInfoWindow = new gmaps.InfoWindow({
                            content: 'Distance: ' + km + ' km<br />Time: ' +
                                    secondsToLegible(time)
                        });
                        gmaps.event.addListener(kmIcon, 'click', function() {
                            kmInfoWindow.open(map, this);
                        });
                    }
                });
            }

            function updateRectangleBounds() {
                rectangle.setBounds(map.getBounds());
            }

            gmaps.event.addListenerOnce(map, 'idle', drawTrack);
            gmaps.event.addListenerOnce(map, 'idle', drawMarkers);
            gmaps.event.addListener(map, 'bounds_changed',
                    _.debounce(updateRectangleBounds, 50));
        });

    }

    initialize();

    return {};
});
