/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['./MathHelper', './MatrixFunctions', 'lodash'],
        function(MathHelper, MatrixFunctions, _) {

    'use strict';

    var Pair = MatrixFunctions.Pair;
    var polyregress = MatrixFunctions.polyregress;

    /**
     * Returns the distance between two points in m
     * (using Haversine formula)
     *
     * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
     *       Sky and Telescope, vol 68, no 2, 1984
     *
     * @param {TrackPoint} from position.
     * @param {TrackPoint} to position.
     * @param {number=} radius of the earth.
     * @return {number} distance in meters.
     */
    function computeDistanceBetween(from, to) {
        // earth radius as used in gps systems (WGS-84)
        var radius = 6378137;

        var lat1 = MathHelper.toRad(from.getLat());
        var lon1 = MathHelper.toRad(from.getLng());
        var lat2 = MathHelper.toRad(to.getLat());
        var lon2 = MathHelper.toRad(to.getLng());

        var dLat = lat2 - lat1;
        var dLon = lon2 - lon1;

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = radius * c;

        return d;
    }

    function kmhToMs(kmh) {
        return kmh / 3.6;
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

    function TrackPoint(lat, lng, time) {
        this._lat = lat;
        this._lng = lng;
        this._time = time;
    }
    TrackPoint.prototype.getLat = function() {
        return this._lat;
    };
    TrackPoint.prototype.getLng = function() {
        return this._lng;
    };
    TrackPoint.prototype.getTime = function() {
        return this._time;
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
    Track.prototype.addPoint = function(point) {
        if (this._points.length === 0) {
            this._points.push(point);
            this._speeds.push(0);
            this._distances.push(0);
            this._times.push(0);
        } else {
            var previousPoint = _.last(this._points);
            var previousDistance = _.last(this._distances);
            var previousTime = _.last(this._times);
            var positionDiff = computeDistanceBetween(previousPoint, point);
            var timeDiff = point.getTime() - previousPoint.getTime();
            var speed = positionDiff / timeDiff;
            //if (isFinite(speed) && !isNaN(speed) &&
            //        speed > kmhToMs(0.01) && speed < kmhToMs(20)) {
                this._points.push(point);
                this._speeds.push(speed);
                this._distances.push(previousDistance + positionDiff);
                this._times.push(previousTime + timeDiff);
            //}
        }
    };
    Track.prototype.getPoints = function() {
        return this._points;
    };
    Track.prototype.getSpeeds = function() {
        return this._speeds;
    };
    Track.prototype.getDistances = function() {
        return this._distances;
    };
    Track.prototype.getTimes = function() {
        return this._times;
    };
    Track.prototype.getCenter = function() {
        var centerLat = _.reduce(this._points, function(memo, point) {
                return memo + point.getLat();
            }, 0) / this._points.length;
        var centerLng = _.reduce(this._points, function(memo, point) {
                return memo + point.getLng();
            }, 0) / this._points.length;
        return new TrackPoint(centerLat, centerLng);
    };
    Track.prototype.getAverageSpeed = function() {
        return this.getTotalDistance() / this.getTotalTime();
    };
    Track.prototype.getAveragePace = function() {
        var kilometers = this.getTotalDistance() / 1000;
        var seconds_per_kilometer = this.getTotalTime() / kilometers;
        return seconds_per_kilometer;
    };
    Track.prototype.getTotalDistance = function() {
        return _.last(this._distances);
    };
    Track.prototype.getTotalTime = function() {
        return _.last(this._times);
    };
    Track.prototype.getDate = function() {
        return this._points[0].getTime();
    };
    Track.prototype.getStartTime = function() {
        return this._points[0].getTime();
    };
    Track.prototype.getEndTime = function() {
        return _.last(this._points).getTime();
    };
    Track.loadFromXml = function(xml) {
        function createTrackPointFromNode(node) {
            //IE8 doesn't understand the '-', 'Z' and has no textContent support
            var timeNode = node.getElementsByTagName('time')[0];
            var timeText = timeNode.textContent || timeNode.text;
            return new TrackPoint(
                parseFloat(node.attributes.getNamedItem('lat').nodeValue),
                parseFloat(node.attributes.getNamedItem('lon').nodeValue),
                stringToEpoch(timeText)
            );
        }

        var track = new Track();
        var trkptNodes;
        var trkptNS = 'http://www.topografix.com/GPX/1/1';
        if (xml.getElementsByTagNameNS) {
            trkptNodes = xml.getElementsByTagNameNS(trkptNS, 'trkpt');
        } else {
            //IE 8 doesn't support getElementsByTagNameNS
            trkptNodes = xml.getElementsByTagName('trkpt');
        }
        var i, len;
        for (i = 0, len = trkptNodes.length; i < len; i += 1) {
            track.addPoint(createTrackPointFromNode(trkptNodes[i]));
        }
        return track;
    };

    Track.prototype.toTrackWithoutOutliers = function() {
        var i, len;
        var outliers = MathHelper.findOutliers(this._speeds);
        var filteredTrack = new Track();
        filteredTrack.addPoint(this._points[0]);
        for (i = 0, len = outliers.length; i < len - 1; i += 1) {
            if (!outliers[i]) {
                filteredTrack.addPoint(this._points[i + 1]);
            }
        }
        return filteredTrack;
    };

    Track.prototype.toTrackWithSgFilter = function() {
        var result = new Track();
        var lats = MathHelper.sgFilter(_.map(this._points, function(el) {
                return el.getLat(); }));
        var lngs = MathHelper.sgFilter(_.map(this._points, function(el) {
                return el.getLng(); }));
        var times = MathHelper.sgFilter(_.map(this._points, function(el) {
                return el.getTime(); }));
        _.each(this._points, function(element, index, list) {
            result.addPoint(new TrackPoint(
                    lats[index], lngs[index], times[index]));
        });
        return result;
    };

    function trackpointMirror(item, pivot) {
        return new TrackPoint(
                (pivot.getLat() * 2) - item.getLat(),
                (pivot.getLng() * 2) - item.getLng(),
                (pivot.getTime() * 2) - item.getTime());
    }

    function trackPointsToLatPairs(time, currentPoints) {
        return _.map(currentPoints, function(point) {
                return new Pair(point.getTime() - time, point.getLat());
                });
    }

    function trackPointsToLngPairs(time, currentPoints) {
        return _.map(currentPoints, function(point) {
                return new Pair(point.getTime() - time, point.getLng());
                });
    }

    Track.prototype.toTrackWithPolyregressionFilter = function() {
        var i;
        var result = new Track();
        var window_size = 15;
        var order = 4;
        var half_window = Math.floor(window_size / 2);
        var padded_arr = MathHelper.padArray(
                this._points, window_size, trackpointMirror);

        for (i = half_window; i < padded_arr.length - half_window; i += 1) {
            var time = padded_arr[i].getTime();
            var currentPoints = padded_arr.slice(
                i - half_window, i + half_window + 1);
            var currentLats = trackPointsToLatPairs(time, currentPoints);
            var currentLngs = trackPointsToLngPairs(time, currentPoints);
            var coeficientsLat = polyregress(currentLats, order);
            var coeficientsLng = polyregress(currentLngs, order);
            //var lat = coeficientsLat[0] + coeficientsLat[1] * time
            //    + coeficientsLat[2] * time * time;
            //var lng = coeficientsLng[0] + coeficientsLng[1] * time
            //    + coeficientsLng[2] * time * time;
            var lat = coeficientsLat[0];
            var lng = coeficientsLng[0];
            //console.log(currentLats, lat);
            result.addPoint(new TrackPoint(lat, lng, time));
        }
        return result;
    };

    // Smooth some data with a given window size.
    // http://en.wikipedia.org/wiki/Gaussian_function
    function smooth(d, w) {
        var result = [];
        for (var i = 0, l = d.length; i < l; ++i) {
            var mn = Math.max(0, i - 5 * w),
                mx = Math.min(d.length - 1, i + 5 * w),
                s = 0.0;
            result[i] = 0.0;
            for (var j = mn; j < mx; ++j) {
                //gauss factors (same, and symetrical)
                var wd = Math.exp(-0.5 * (i - j) * (i - j) / w / w);
                result[i] += wd * d[j];
                s += wd;
            }
            result[i] /= s;
        }
        return result;
    }
    
    Track.prototype.toSmoothTrack = function() {
        var i;
        var result = new Track();
        var window_size = 2;
        var half_window = Math.floor(window_size / 2);
        var padded_arr = MathHelper.padArray(
                this._points, window_size, trackpointMirror);
        
        var lats = _.map(padded_arr, function(el) { return el.getLat(); });
        var lngs = _.map(padded_arr, function(el) { return el.getLng(); });
        //var smoothLats = smooth(lats, window_size);
        //var smoothLngs = smooth(lngs, window_size);
        var smoothLats = smoothFast(lats, window_size);
        var smoothLngs = smoothFast(lngs, window_size);
        //console.log(lats);
        //console.log(smoothLats);
        for (i = half_window; i < padded_arr.length - half_window; i += 1) {
            result.addPoint(new TrackPoint(smoothLats[i], smoothLngs[i], padded_arr[i].getTime()));
        }
        return result;
    };

    return Track;
});
