/*jslint nomen: true, plusplus: true, vars: true */
/*global google:false, _:false, window:false, document:false */

// IE 6: map doesn't show, works in IE 7

(function (XMLHttpRequest, DOMParser, ActiveXObject, google, _, window, document) {

    'use strict';

    var NOOP = function () {};

    /**
     * worst Promise implementation ever
     */
    function Promise() {
        this._rc = NOOP;
        this._ec = NOOP;
    }
    Promise.prototype.resolve = function (value) {
        this._rc.call(this, value);
    };
    Promise.prototype.reject = function (error) {
        this._ec.call(this, error);
    };
    Promise.prototype.then = function (resolvedCallback, errorCallback) {
        this._rc = resolvedCallback || NOOP;
        this._ec = errorCallback || NOOP;
    };

    function fetchTextAsync(url) {
        var promise = new Promise();
        var xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP.3.0');
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType('text/plain; charset=UTF-8');
        }
        xhr.onreadystatechange = function () {
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
        fetchTextAsync(url).then(function (responseText) {
            // xml is invalid sometimes
            if (responseText.indexOf('</trkseg>') === -1) {
                responseText = responseText.replace('</trk>', '</trkseg></trk>');
            }
            var xml;
            if (DOMParser) {
                xml = (new DOMParser()).parseFromString(responseText, 'text/xml');
            } else {
                xml = new ActiveXObject('Microsoft.XMLDOM');
                xml.async = false;
                xml.loadXML(responseText);
            }
            promise.resolve(xml);
        });
        return promise;
    }

    /**
     * @param {number} degrees
     * @return {number} radians
     */
    function toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Returns the distance between two points in m
     * (using Haversine formula)
     *
     * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
     *       Sky and Telescope, vol 68, no 2, 1984
     * 
     * @param {LatLng} from
     * @param {LatLng} to
     * @param {number=} radius
     * @return {number} distance in meters
     */
    function computeDistanceBetween(from, to) {
        // earth radius as used in gps systems (WGS-84)
        var radius = 6378137;

        var lat1 = toRad(from.lat());
        var lon1 = toRad(from.lng());
        var lat2 = toRad(to.lat());
        var lon2 = toRad(to.lng());

        var dLat = lat2 - lat1;
        var dLon = lon2 - lon1;

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = radius * c;

        return d;
    }

    function msToKmh(ms) {
        return ms * 3.6;
    }

    function kmhToMs(kmh) {
        return kmh / 3.6;
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

    function stringToEpoch(str) {
        // 2012-07-09T19:04:03Z
        var parts = str.split(/[\-T:Z]/g);
        var date = new Date();
        date.setUTCFullYear(parseInt(parts[0], 10));
        date.setUTCMonth(parseInt(parts[1], 10) - 1);
        date.setUTCDate(parseInt(parts[2], 10));
        date.setUTCHours(parseInt(parts[3], 10));
        date.setUTCMinutes(parseInt(parts[4], 10));
        date.setUTCSeconds(parseInt(parts[5], 10));
        date.setUTCMilliseconds(0);
        return date.getTime() / 1000;
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
        // IE 8 doesn't understand the '-', 'Z' and has no textContent support
        var timeNode = node.getElementsByTagName('time')[0];
        var timeText = timeNode.textContent || timeNode.text;
        return new TrackPoint(
            parseFloat(node.attributes.getNamedItem('lat').nodeValue),
            parseFloat(node.attributes.getNamedItem('lon').nodeValue),
            stringToEpoch(timeText)
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
            var positionDiff = computeDistanceBetween(previousPoint.getLatLng(), point.getLatLng());
            var timeDiff = point.getTime() - previousPoint.getTime();
            var speed = positionDiff / timeDiff;
            if (isFinite(speed) && !isNaN(speed) && speed > kmhToMs(0.01)  && speed < kmhToMs(50)) {
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
        return secondsToLegible(seconds_per_kilometer);
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
        var promise = new Promise();
        loadXml(url).then(function (xml) {
            var track = new Track();
            var trkptNodes;
            if (xml.getElementsByTagNameNS) {
                trkptNodes = xml.getElementsByTagNameNS('http://www.topografix.com/GPX/1/1', 'trkpt');
            } else {
                //IE 8 doesn't support getElementsByTagNameNS
                trkptNodes = xml.getElementsByTagName('trkpt');
            }
            var i, len;
            track.addPoint(TrackPoint.createFromNode(trkptNodes[0]));
            for (i = 0, len = trkptNodes.length; i < len; i++) {
                track.addPoint(TrackPoint.createFromNode(trkptNodes[i]));
            }
            promise.resolve(track);
        });
        return promise;
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

        Track.loadFromXml(url).then(function (track) {

            document.getElementById('date').innerHTML = track.getDate();
            document.getElementById('starttime').innerHTML = track.getStartTime();
            document.getElementById('endtime').innerHTML = track.getEndTime();
            document.getElementById('distance').innerHTML = (track.getTotalDistance() / 1000).toFixed(2) + ' km';
            document.getElementById('duration').innerHTML = secondsToLegible(track.getTotalTime());
            document.getElementById('avgpace').innerHTML = track.getAveragePace() + ' /km';
            document.getElementById('avgspeed').innerHTML = msToKmh(track.getAverageSpeed()).toFixed(2) + ' km/h';

            var center = track.getCenter();

            // http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
            var myOptions = {
                    zoom: 15,
                    center: center,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
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
                };

            var map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

            var mapReady = false;
            var rectangle = new google.maps.Rectangle();
            var polyline;

            function drawTrack() {
                var colors = _.map(track.getSpeeds(), speedToColor);
                var coordinates = track.getCoordinates();
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

                for (i = 1, len = colors.length; i < len; i++) {
                    currentPoint = coordinates[i];
                    currentColorPoints.push(currentPoint);
                    if (colors[i] !== currentColor || i === len - 1) {
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

            google.maps.event.addListener(map, 'bounds_changed', _.debounce(onBoundsChanged, 50));

        });

    }

    window.onload = initialize;

}(window.XMLHttpRequest, window.DOMParser, window.ActiveXObject, google, _, window, document));

