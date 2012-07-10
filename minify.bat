@ECHO OFF
PUSHD %~dp0
CALL vendor\node_modules\.bin\uglifyjs.cmd --verbose --output lodash.min.js lodash.js
CALL vendor\node_modules\.bin\uglifyjs.cmd --no-copyright --verbose --output main.min.js main.js
PAUSE