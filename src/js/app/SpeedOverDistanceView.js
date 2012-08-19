/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['./Drawing', './MathHelper', 'lodash'],
    function(Drawing, MathHelper, _) {

    'use strict';

    function SpeedOverDistanceView(id, track) {

        var chartDiv = document.getElementById(id);
        var width = chartDiv.offsetWidth;
        var height = chartDiv.offsetHeight;

        var distances = track.getDistances();
        var speeds = track.getSpeeds();

        speeds = MathHelper.sgFilter(speeds);

        var coords_arr = [];
        var firstDistance = distances[0];
        var lastDistance = _.last(distances);
        var i, leni;
        for (i = 0, leni = speeds.length; i < leni; i += 1) {
            var distance = distances[i];
            coords_arr.push(
                    (distances[i] - firstDistance) *
                        width / (lastDistance - firstDistance),
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

    return SpeedOverDistanceView;
});
