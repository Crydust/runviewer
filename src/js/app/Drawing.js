/*jslint nomen: false, plusplus: true, vars: true, browser: true, white: false,
bitwise: true */
/*jshint nomen: false, white: false */
/*global define: false, window:false, XMLHttpRequest: false,
ActiveXObject: false, DOMParser: false */

define([], function() {

    'use strict';

    var EXCANVAS_COMPATIBLE = true;

    /**
     * @constructor
     */
    function CanvasDrawing() {
        //this.canvas_ = null;
        //this.ctx_ = null;
    }

    /**
     * encapsulates the creation of the "magical" object
     * @param {!number} width in pixels.
     * @param {!number} height in pixels.
     */
    CanvasDrawing.prototype.createGraphics = function(width, height) {
        this.canvas_ = document.createElement('canvas');

        var devicePixelRatio = 1;

        if (window.devicePixelRatio) {
            devicePixelRatio = window.devicePixelRatio;
        }

        if (EXCANVAS_COMPATIBLE) {
            // if it is IE lt 9
            var G_vmlCanvasManager = window.G_vmlCanvasManager;
            if (typeof G_vmlCanvasManager !== 'undefined') {
                document.body.appendChild(this.canvas_);
                this.canvas_.setAttribute('width', width * devicePixelRatio);
                this.canvas_.setAttribute('height', height * devicePixelRatio);
                // reassign to the new element created by initElement
                this.canvas_ = G_vmlCanvasManager.initElement(this.canvas_);
            }
        }

        this.canvas_.width = width * devicePixelRatio;
        this.canvas_.height = height * devicePixelRatio;
        this.ctx_ = this.canvas_.getContext('2d');

        if (devicePixelRatio !== 1) {
            this.canvas_.style.width = width + 'px';
            this.canvas_.style.height = height + 'px';
            this.ctx_.scale(devicePixelRatio, devicePixelRatio);
        }
    };

    /**
     * @private
     * @param {!string} hexColor css color of the form '#rrggbb'.
     * @param {!number} alpha between 0 and 1.
     * @return {!string} rgb or rgba color.
     */
    CanvasDrawing.prototype.hexToRgba_ = function(hexColor, alpha) {
        /*
        var color = parseInt(hexColor.substr(1, 6), 16);
        var r = (color >> 16) & 0xFF;
        var g = (color >> 8) & 0xFF;
        var b = color & 0xFF;
        */
        var r = parseInt(hexColor.substr(1, 2), 16);
        var g = parseInt(hexColor.substr(3, 2), 16);
        var b = parseInt(hexColor.substr(5, 2), 16);
        if (alpha < 1) {
            return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    };

    /**
     * draws a single shape
     * @param {!string} shape one of poly, circle, rect.
     * @param {!Array.<number>} coords_arr coordinates for shape.
     * @param {!number} strokewidth integer strokewidth.
     * @param {!string} stroke hexadecimal color #123456.
     * @param {!number} strokealpha float [0, 1] 0 is transparent, 1 is opaque.
     * @param {!string} fill hexadecimal color #123456.
     * @param {!number} fillalpha float [0, 1] 0 is transparent, 1 is opaque.
     */
    CanvasDrawing.prototype.drawShape = function(
                shape, coords_arr, 
                strokewidth, stroke, strokealpha, 
                fill, fillalpha) {
        var i, leni, x, y, w, h;
        this.ctx_.beginPath();
        switch (shape) {
            case 'poly':
                this.ctx_.moveTo(coords_arr[0], coords_arr[1]);
                for (i = 0, leni = coords_arr.length; i < leni; i += 2) {
                    this.ctx_.lineTo(coords_arr[i], coords_arr[i + 1]);
                }
                if (fillalpha > 0) {
                    this.ctx_.lineTo(coords_arr[0], coords_arr[1]);
                }
                break;
            case 'circle':
                this.ctx_.moveTo(coords_arr[0] + coords_arr[2], coords_arr[1]);
                this.ctx_.arc(coords_arr[0], coords_arr[1], coords_arr[2],
                              0, Math.PI * 2, false);
                break;
            case 'rect':
                x = coords_arr[0];
                y = coords_arr[1];
                w = coords_arr[2] - x;
                h = coords_arr[3] - y;
                if (strokewidth % 2 === 1) {
                    x += 0.5;
                    y += 0.5;
                }
                this.ctx_.rect(x, y, w, h);
                break;
        }
        if (fillalpha > 0) {
            this.ctx_.closePath();
            this.ctx_.fillStyle = this.hexToRgba_(fill, fillalpha);
            this.ctx_.fill();
        }
        this.ctx_.strokeStyle = this.hexToRgba_(stroke, strokealpha);
        this.ctx_.lineWidth = strokewidth;
        this.ctx_.stroke();
    };

    /**
     * ends the drawing and adds it to the dom
     * @param {HTMLElement} container to which a canvas will be appended.
     */
    CanvasDrawing.prototype.renderGraphics = function(container) {
        container.appendChild(this.canvas_);
        delete this.canvas_;
    };

    return CanvasDrawing;
});
