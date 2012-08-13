/*jslint nomen: false, plusplus: true, vars: true, browser: true,
white: false */
/*jshint nomen: false, white: false */
/*global define: false */
define([], function() {

/***************************************************************************
 *   Copyright (C) 2009 by Paul Lutus                                      *
 *   lutusp@arachnoid.com                                                  *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/

    function Pair(x, y){
        this.x = x;
        this.y = y;
    }
    
    Pair.prototype.toString = function (){
        return this.x + "," + this.y;
    };
    
    function gj_divide(a, i, j, m) {
        var q;
        for (q = j + 1; q < m; q++) {
            a[i][q] /= a[i][j];
        }
        a[i][j] = 1;
    }

    function gj_eliminate(a, i, j, n, m) {
        var k, q;
        for (k = 0; k < n; k++) {
            if (k != i && a[k][j] != 0) {
                for (q = j + 1; q < m; q++) {
                    a[k][q] -= a[k][j] * a[i][q];
                }
                a[k][j] = 0;
            }
        }
    }

    function gj_echelonize(a) {
        var n = a.length,
        m = a[0].length,
        i = 0,
        j = 0,
        k,
        temp;
        while (i < n && j < m) {
            //look for non-zero entries in col j at or below row i
            k = i;
            while (k < n && a[k][j] == 0) {
                k++;
            }
            // if an entry is found at row k
            if (k < n) {
                //  if k is not i, then swap row i with row k
                if (k != i) {
                    temp = a[i];
                    a[i] = a[k];
                    a[k] = temp;
                }
                // if a[i][j] is != 1, divide row i by A[i][j]
                if (a[i][j] != 1) {
                    gj_divide(a, i, j, m);
                }
                // eliminate all other non-zero entries
                gj_eliminate(a, i, j, n, m);
                i++;
            }
            j++;
        }
    }
    
    function create1dArray(columns, value){
        var result = [], c;
        for(c=0;c<columns;c+=1){
            result.push(value);
        }
        return result;
    }
    function create2dArray(rows, columns, value){
        var result = [], r;
        for(r=0;r<rows;r+=1){
            result.push(create1dArray(columns, value));
        }
        return result;
    }
    
/*
    public double corr_coeff(Pair[] data, double[] terms) {
        double r = 0;
        int n = data.length;
        double sx = 0, sx2 = 0, sy = 0, sy2 = 0, sxy = 0;
        double x, y;
        for (Pair pr : data) {
            x = parent.fx(pr.x, terms);
            y = pr.y;
            sx += x;
            sy += y;
            sxy += x * y;
            sx2 += x * x;
            sy2 += y * y;
        }
        double div = Math.sqrt((sx2 - (sx * sx) / n) * (sy2 - (sy * sy) / n));
        if (div != 0) {
            r = Math.pow((sxy - (sx * sy) / n) / div, 2);
        }
        return r;
    }

    public double std_error(Pair[] data, double[] terms) {
        double r = 0;
        int n = data.length;
        if (n > 2) {
            double a = 0;
            for (Pair pr : data) {
                a += Math.pow((parent.fx(pr.x, terms) - pr.y), 2);
            }
            r = Math.sqrt(a / (n - 2));
        }
        return r;
    }
*/
    function polyregress(data, p) {
        p += 1;
        var n = data.length,
        r, c, i, j,
        rs = 2 * p - 1,
        //
        // by request: read each datum only once
        // not the most efficient processing method
        // but required if the data set is huge
        //
        // create square matrix with added RH column
        m = create2dArray(p, p+1, null),
        // create array of precalculated matrix data
        mpc = create1dArray(rs, null);
        mpc[0] = n;
        for (i=0; i<n; i+=1) {
            pr = data[i];
            // process precalculation array
            for (r = 1; r < rs; r++) {
                mpc[r] += Math.pow(pr.x, r);
            }
            // process RH column cells
            m[0][p] += pr.y;
            for (r = 1; r < p; r++) {
                m[r][p] += Math.pow(pr.x, r) * pr.y;
            }
        }
        // populate square matrix section
        for (r = 0; r < p; r++) {
            for (c = 0; c < p; c++) {
                m[r][c] = mpc[r + c];
            }
        }
        //parent.show_mat(m);
        // reduce matrix
        gj_echelonize(m);
        //parent.show_mat(m);
        // extract rh column
        result = create1dArray(p, null);
        for (j = 0; j < p; j++) {
            result[j] = m[j][p];
        }
        return result;
    }
    
    return {
        'Pair': Pair,
        'polyregress': polyregress
    };
});
