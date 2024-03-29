/*global require */

// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
require.config({
    'baseUrl': 'js/lib',
    'paths': {
        'app': '../app'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
require(['app/main', 'ga']);
