/*global define: false, window: false */
define([], function () {
    'use strict';
    return window.google;
});

/*
(function () {
    var callbackName = 'gmapscallback';
    window[callbackName] = function () {};
    define(['http://maps.googleapis.com/maps/api/js?sensor=true&callback=' + callbackName], function () {
        return window.google;
    });
    
}());
*/
