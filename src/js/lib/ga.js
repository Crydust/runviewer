/*jslint sloppy:  true, nomen: true, vars: true */
/*global define: false, window: false, document: false */
define([], function () {
    var domain = 'crydust.be';
    if (window.location.hostname.indexOf(domain) !== -1) {
        var _gaq = [];
        _gaq.push(['_setAccount', 'UA-20239111-1']);
        _gaq.push(['_setDomainName', domain]);
        _gaq.push(['_trackPageview']);
        (function () {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);
        }());
    }
    return {};
});