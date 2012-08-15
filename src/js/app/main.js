/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false, window:false, XMLHttpRequest: false,
ActiveXObject: false, DOMParser: false */

// IE 6: map doesn't show, works in IE 7

define(['require', './Drawing', './MapView', './Converter', './Promise',
        './MathHelper', './Track', 'lodash', 'domReady!'],
    function(require, Drawing, MapView, Converter, Promise,
        MathHelper, Track, _, document) {

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

    function parseXml(responseText) {
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
        return xml;
    }

    function loadXml(url) {
        var promise = new Promise();
        fetchTextAsync(url).then(function(responseText) {
            promise.resolve(parseXml(responseText));
        });
        return promise;
    }


    function randomFromInterval(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
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
                //'RK_gpx _2012-08-09_2201.gpx', // start is bumpy
                'RK_gpx _2012-08-12_1130.gpx' // start is extremely bumpy
            ];

        var url = urls[randomFromInterval(0, urls.length - 1)];

        loadXml(url).then(function(xml) {

            var track = Track.loadFromXml(xml);
            track = track.toTrackWithoutOutliers();
            //track = track.toTrackWithSgFilter();
            track = track.toTrackWithPolyregressionFilter();

            // stats
            _.each({
                'date': Converter.epochToDateString(track.getDate()),
                'starttime': Converter.epochToTimeString(track.getStartTime()),
                'endtime': Converter.epochToTimeString(track.getEndTime()),
                'distance': (track.getTotalDistance() / 1000).toFixed(2) +
                        ' km',
                'duration': Converter.secondsToLegible(track.getTotalTime()),
                'avgpace': Converter.secondsToLegible(track.getAveragePace()) +
                        ' /km',
                'avgspeed': Converter.convertMsToKmh(
                        track.getAverageSpeed()).toFixed(2) + ' km/h'
            }, function(value, key, list) {
                document.getElementById(key).innerHTML = value;
            });


            // speed chart
            var chartDiv = document.getElementById('speed_chart');
            var width = chartDiv.offsetWidth;
            var height = chartDiv.offsetHeight;

            var points = track.getPoints();
            var speeds = track.getSpeeds();
            var coords_arr = [];
            var firstTime = points[0].getTime();
            var lastTime = _.last(points).getTime();
            var i, leni;
            for (i = 0, leni = speeds.length; i < leni; i += 1) {
                var point = points[i];
                coords_arr.push(
                        (points[i].getTime() - firstTime) *
                            width / (lastTime - firstTime),
                        height - (speeds[i] * (height / 5)));
            }
            coords_arr.push(width, height, 0, height);

            var drawing = new Drawing();
            drawing.createGraphics(width, height);

            drawing.drawShape('poly', [0, 10.5, width, 10.5],
                1, '#CCCCCC', 1.0,
                '#0000FF', 0.0);
            drawing.drawShape('poly', [0, 20.5, width, 20.5],
                1, '#CCCCCC', 1.0,
                '#0000FF', 0.0);
            drawing.drawShape('poly', [0, 30.5, width, 30.5],
                1, '#CCCCCC', 1.0,
                '#0000FF', 0.0);
            drawing.drawShape('poly', [0, 40.5, width, 40.5],
                1, '#CCCCCC', 1.0,
                '#0000FF', 0.0);
            drawing.drawShape('poly', coords_arr,
                1, '#0000FF', 1.0,
                '#0000FF', 0.5);
            drawing.renderGraphics(chartDiv);

            // maps
            var mapView = new MapView('map_canvas', track);
        });

    }

    initialize();

    return {};
});
