/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['./Drawing', 'lodash'], function(Drawing, _) {

    'use strict';

    function SpeedOverTimeView(id, track) {

        var chartDiv = document.getElementById(id);
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
    }

    return SpeedOverTimeView;
});
