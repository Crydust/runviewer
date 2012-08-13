define(['app/MatrixFunctions'], function(MatrixFunctions) {

    var Pair = MatrixFunctions.Pair;
    var polyregress = MatrixFunctions.polyregress;
    
    function assertArrayEquals(expResult, result, delta) {
        var i, leni;
        if (expResult.length != result.length) {
            return false;
        }
        for (i=0, leni=expResult.length; i<leni; i+=1){
            if (Math.abs(expResult[i] - result[i]) > delta) {
                return false;
            }
        }
        return true;
    }
    
    module('MatrixFunctions');

    test('testPolyregress', function(){
        expect(1);
        
        var data = [
            new Pair(0, 1),
            new Pair(1, 2),
            new Pair(3, 2),
            new Pair(4, 3),
            new Pair(5, 1)
        ];
        var p = 2;
        var expResult = [
            9.642857142857e-01,
            1.232142857143e+00,
            -2.321428571429e-01];
        /*
        Degree 2, 5 x,y pairs. Corr. coeff. (r^2) = 6,045918367347e-01. SE = 6,074928962940e-01

        f(x) =   9,642857142857e-01
             +   1,232142857143e+00 * x
             +  -2,321428571429e-01 * x^2
        */
        var result = polyregress(data, p);
        ok(assertArrayEquals(expResult, result, 1e-12));
        
        //QUnit.equal(expResult, result);
    });

    return {};
    
});