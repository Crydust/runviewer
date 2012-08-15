/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['lodash'], function(_) {

    'use strict';

    function padLeft(s, length, chr) {
        var result = String(s);
        while (result.length < length) {
            result = chr + result;
        }
        return String(result);
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
    function convertMsToKmh(ms) {
        return ms * 3.6;
    }
    function convertSpeedToColor(speed) {
        var kmh = convertMsToKmh(speed);
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

    return {
        secondsToLegible: secondsToLegible,
        convertMsToKmh: convertMsToKmh,
        convertSpeedToColor: convertSpeedToColor,
        epochToDateString: epochToDateString,
        epochToTimeString: epochToTimeString
    };
});
