/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define(['lodash'], function(_) {

    'use strict';

    /**
     * Savitzky-Golay filter with precomputed coeficients
     */
    function sgFilter(numbers_arr) {
        var window_size = 7;
        var order = 2;
        var result = [], i, j;
        var coefficients = [-0.0952381, 0.14285714, 0.28571429, 0.33333333,
                0.28571429, 0.14285714, -0.0952381];
        //walking average used to be
        //coefficients = [1/18, 2/18, 3/18, 6/18, 3/18, 2/18, 1/18]
        var half_window = Math.floor(window_size / 2);
        var padleft = numbers_arr.slice(1, half_window + 1).reverse();
        var padRight = numbers_arr.slice(numbers_arr.length - half_window - 1,
        numbers_arr.length - 1).reverse();
        for (i = 0; i < half_window; i += 1) {
            padleft[i] = (numbers_arr[0] * 2) - padleft[i];
            padRight[i] = (numbers_arr[numbers_arr.length - 1] * 2) -
                    padRight[i];
        }
        var padded_arr = padleft.concat(numbers_arr).concat(padRight);
        for (i = half_window; i < padded_arr.length - half_window; i += 1) {
            var newValue = 0;
            for (j = 0; j < window_size; j += 1) {
                newValue += coefficients[j] * padded_arr[i + j - half_window];
            }
            result.push(newValue);
        }
        return result;
    }

    function findOutliers(numbers_arr) {
        var n = numbers_arr.length;
        var cleanNumbers_arr = _.filter(numbers_arr, function(n) {
            return isFinite(n) && !isNaN(n);
        });
        var mean = _.reduce(cleanNumbers_arr, function(memo, xi) {
                return memo + xi;
            }, 0) / n;
        var s = Math.sqrt(_.reduce(cleanNumbers_arr, function(memo, xi) {
                return memo + Math.pow(xi - mean, 2);
            }, 0) / (n - 1));
        // t distribution 95% sure upper bound
        var upper = mean + 1.960 * s;
        //console.log('mean', (mean * 3.6).toFixed(2));
        //console.log('upper', (upper * 3.6).toFixed(2));
        return _.map(numbers_arr, function(n) {
            return !isFinite(n) || isNaN(n) || n < 0.01 || n > upper;
        });
    }

    /**
     * @param {number} degrees angle.
     * @return {number} radians.
     */
    function toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    return {
        'sgFilter': sgFilter,
        'toRad': toRad,
        'findOutliers': findOutliers
    };
});
