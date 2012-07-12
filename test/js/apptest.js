//Main file for loading RequireJS necessary bits
QUnit.config.autostart = false;

if (console && console.log) {
    QUnit.moduleStart = function (obj) {
        /*
        console.log('= ' + obj.name);
        */
    };
    QUnit.testStart = function (obj) {
        /*
        console.log(('- ' + obj.name);
        */
    }; 
    QUnit.testDone = function (obj) {
        if (obj.failed > 0) {
            console.log('- ' + obj.name + ' (' 
                + obj.failed + ', '
                + obj.passed + ', '
                + obj.total
                + ')');
        }
    }; 
    QUnit.moduleDone = function (obj) {
        if (obj.failed > 0) {
            console.log('= ' + obj.name + ' (' 
                + obj.failed + ', '
                + obj.passed + ', '
                + obj.total
                + ')');
        }
    };
    
    QUnit.log = function (obj) {
        if (obj.result === false) {
            var message = obj.message || ( obj.result ? "okay" : "failed");
            console.log(message);
            console.log(' Expected: ' + obj.expected);
            if (obj.expected != obj.actual) {
                console.log('   Result: ' + obj.actual);
                if (obj.source) {
                    console.log('   Source: ' + obj.source);
                }
            }
            //console.log('');
        }
    };
}

require.config({
    baseUrl: '../src/js/lib',
    paths: {
        'app': '../app',
        'apptest': '../../../test/js/apptest'
    }
});

require(['apptest/main'], function(){
    QUnit.start(); //Tests loaded, run tests
});