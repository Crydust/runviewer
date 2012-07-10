/*jslint nomen: true, plusplus: true, vars: true */
/*global XMLHttpRequest:false, DOMParser:false, google:false, _:false, window:false, document:false */

(function (XMLHttpRequest, DOMParser, google, _, window, document) {

    "use strict";

    function loadXml(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        //xhr.overrideMimeType('text/xml; charset=UTF-8');
        xhr.send(null);
        var xml = null;
        if (xml === null) {
            var responseText = xhr.responseText;

            // xml is invalid sometimes
            if (responseText.indexOf('</trkseg>') === -1) {
                responseText = responseText.replace('</trk>', '</trkseg></trk>');
            }

            xml = (new DOMParser()).parseFromString(responseText, 'text/xml');
        }
        return xml;
    }

    function ms_to_kmh(ms) {
        return ms * 3.6;
    }

    function kmh_to_ms(kmh) {
        return kmh / 3.6;
    }
    
    function padLeft(s, length, chr) {
	    var result = String(s);
	    while (result.length < length) {
        	result = chr + result;
        }
        return String(result);
    }
    
    function seconds_to_legible(s) {
        var hours = Math.floor(s / 3600);
        var minutes = Math.floor((s - hours * 3600) / 60);
        var seconds = Math.floor((s - hours * 3600 - minutes * 60));
        var result = '%dm %ds';
        if (hours > 0) {
	        result = '%dh %dm %ds';
	        result = result.replace('%d', padLeft(hours, 2, '0'))
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

    function speed_to_color(speed) {
        var kmh = ms_to_kmh(speed);

        if (kmh < 7) {
            return '#B22424';
        } else if (kmh < 8) {
            return '#FF9933';
        } else if (kmh < 9) {
            return '#DDDD33';
        } else if (kmh < 10) {
            return '#88EE33';
        //} else if (kmh < 11) {
        //    return '#24B224';
        } else {
            return '#24B224';
        }
    }

    function TrackPoint(lat, lng, time) {
        this._lat = lat;
        this._lng = lng;
        this._time = time;
    }
    TrackPoint.prototype.getLat = function () {
        return this._lat;
    };
    TrackPoint.prototype.getLng = function () {
        return this._lng;
    };
    TrackPoint.prototype.getTime = function () {
        return this._time;
    };
    TrackPoint.prototype.getLatLng = function () {
        return new google.maps.LatLng(this._lat, this._lng);
    };
    TrackPoint.createFromNode = function (node) {
        return new TrackPoint(
            parseFloat(node.attributes.getNamedItem('lat').nodeValue),
            parseFloat(node.attributes.getNamedItem('lon').nodeValue),
            Date.parse(node.getElementsByTagName('time')[0].textContent) / 1000
        );
    };

    function Track() {
        //these are the trackpoints
        this._points = [];
        //speed from previous point to here in meter per second
        this._speeds = [];
        //cumulative distance to here in meters
        this._distances = [];
        //cumulative time to here in seconds (starts at zero)
        this._times = [];
    }
    Track.prototype.addPoint = function (point) {
        if (this._points.length === 0) {
            this._points.push(point);
            this._speeds.push(0);
            this._distances.push(0);
            this._times.push(0);
        } else {
            var previousPoint = this._points[this._points.length - 1];
            var previousDistance = this._distances[this._distances.length - 1];
            var previousTime = this._times[this._times.length - 1];
            var positionDiff = google.maps.geometry.spherical.computeDistanceBetween(previousPoint.getLatLng(), point.getLatLng());
            var timeDiff = point.getTime() - previousPoint.getTime();
            var speed = positionDiff / timeDiff;
            if (isFinite(speed) && !isNaN(speed) && speed > kmh_to_ms(0.01)  && speed < kmh_to_ms(50)) {
                this._points.push(point);
                this._speeds.push(speed);
                this._distances.push(previousDistance + positionDiff);
                this._times.push(previousTime + timeDiff);
            }
        }
    };
    Track.prototype.getCoordinates = function () {
        return _.map(this._points, function (point) {return point.getLatLng(); });
    };
    Track.prototype.getSpeeds = function () {
        return this._speeds;
    };
    Track.prototype.getCenter = function () {
        var centerLat = _.reduce(this._points, function (memo, point) {return memo + point.getLat(); }, 0) / this._points.length;
        var centerLng = _.reduce(this._points, function (memo, point) {return memo + point.getLng(); }, 0) / this._points.length;
        return new google.maps.LatLng(centerLat, centerLng);
    };
    Track.prototype.getAverageSpeed = function () {
        return this.getTotalDistance() / this.getTotalTime();
    };
    Track.prototype.getAveragePace = function () {
        var kilometers = this.getTotalDistance() / 1000;
        var seconds_per_kilometer = this.getTotalTime() / kilometers;
        return seconds_to_legible(seconds_per_kilometer);
    };
    Track.prototype.getTotalDistance = function () {
        return this._distances[this._distances.length - 1];
    };
    Track.prototype.getTotalTime = function () {
        return this._times[this._times.length - 1];
    };
    Track.prototype.getDate = function () {
        return epochToDateString(this._points[0].getTime());
    };
    Track.prototype.getStartTime = function () {
        return epochToTimeString(this._points[0].getTime());
    };
    Track.prototype.getEndTime = function () {
        return epochToTimeString(this._points[this._points.length - 1].getTime());
    };
    Track.loadFromXml = function (url) {
        var track = new Track();
        var xml = loadXml(url);
        return;
        //console.log('xml', xml);
        var trkptNodes = xml.getElementsByTagNameNS('http://www.topografix.com/GPX/1/1', 'trkpt');
        var i, len;
        //var trkptNodes = xml.getElementsByTagNameNS('trkpt');
        //console.log('trkptNodes', trkptNodes);
        track.addPoint(TrackPoint.createFromNode(trkptNodes[0]));
        for (i = 0, len = trkptNodes.length; i < len; i++) {
            track.addPoint(TrackPoint.createFromNode(trkptNodes[i]));
        }
        return track;
    };

    function initialize() {
        var urls = [
                //'RK_gpx _2012-07-01_2045.gpx',
                //'RK_gpx _2012-07-06_1254.gpx',
                //'RK_gpx _2012-07-06_1334.gpx',
                //'RK_gpx _2012-07-06_2229.gpx',
                'RK_gpx _2012-07-09_2104.gpx'
            ];

        var url = urls[randomFromInterval(0, urls.length - 1)];
        //console.log(url);

        var track = Track.loadFromXml(url);
        var center = track.getCenter();

        document.getElementById('date').innerHTML = track.getDate();
        document.getElementById('starttime').innerHTML = track.getStartTime();
        document.getElementById('endtime').innerHTML = track.getEndTime();
        document.getElementById('distance').innerHTML = (track.getTotalDistance() / 1000).toFixed(2) + ' km';
        document.getElementById('duration').innerHTML = seconds_to_legible(track.getTotalTime());
        document.getElementById('avgpace').innerHTML = track.getAveragePace() + ' /km';
        document.getElementById('avgspeed').innerHTML = ms_to_kmh(track.getAverageSpeed()).toFixed(2) + ' km/h';

        // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
        var myOptions = {
                zoom: 15,
                center: center,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                //disableDefaultUI: true,
                styles: [{
						featureType: "poi",
						stylers: [
							{ visibility: "off" }
						]
					},{
						featureType: "administrative",
						stylers: [
							{ visibility: "off" }
						]
					},{
						featureType: "landscape",
						stylers: [
							{ visibility: "off" }
						]
					},{
						featureType: "transit",
						stylers: [
							{ visibility: "off" }
						]
					}]
            };
        // ROADMAP, TERRAIN
        var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

        /*
        new google.maps.Polyline({
          path: track.getCoordinates(),
          strokeColor: "#000000",
          strokeOpacity: 1.0,
          strokeWeight: 5
        }).setMap(map);
        */

        var mapReady = false;
        var rectangle = new google.maps.Rectangle();
        var polyline;

        function drawTrack() {
            var colors = _.map(track.getSpeeds(), speed_to_color);
            var coordinates = track.getCoordinates();
            var currentColor = colors[1];
            var previousPoint = coordinates[0];

            var currentColorPoints = [];
            var i, len, currentPoint;
            currentColorPoints.push(previousPoint);

            rectangle.setOptions({
                strokeColor: "#000000",
                strokeOpacity: 0,
                strokeWeight: 0,
                fillColor: "#000000",
                fillOpacity: 0.7,
                map: map,
                bounds: map.getBounds()
            });

            for (i = 1, len = colors.length; i < len; i++) {
                //console.log('i = '+i);
                currentPoint = coordinates[i];
                currentColorPoints.push(currentPoint);
                if (colors[i] !== currentColor || i === len - 1) {
                    //console.log('currentColor = '+currentColor);
                    polyline = new google.maps.Polyline({
                        path: currentColorPoints,
                        strokeColor: currentColor,
                        strokeOpacity: 0.9,
                        strokeWeight: 5,
                        map: map
                    });

                    currentColor = colors[i];
                    currentColorPoints = [];
                    currentColorPoints.push(currentPoint);
                }
            }
        }

        function onBoundsChanged() {
            if (!mapReady) {
                drawTrack();
                mapReady = true;
            } else {
                rectangle.setBounds(map.getBounds());
            }
        }

        google.maps.event.addListener(map, 'bounds_changed', onBoundsChanged);


    }

    window.onload = initialize();

}(XMLHttpRequest, DOMParser, google, _, window, document));

