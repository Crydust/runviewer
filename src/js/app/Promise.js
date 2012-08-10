/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define([], function() {

    'use strict';

    var NOOP = function() {};

    /**
     * worst Promise implementation ever
     */
    function Promise() {
        this._rc = NOOP;
        this._ec = NOOP;
    }
    Promise.prototype.resolve = function(value) {
        this._rc.call(this, value);
    };
    Promise.prototype.reject = function(error) {
        this._ec.call(this, error);
    };
    Promise.prototype.then = function(resolvedCallback, errorCallback) {
        this._rc = resolvedCallback || NOOP;
        this._ec = errorCallback || NOOP;
    };

    return Promise;
});
