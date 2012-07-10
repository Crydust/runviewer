@ECHO OFF
PUSHD %~dp0
node vendor\bestiejs-lodash-c733a3b\build.js include=map,reduce
COPY vendor\bestiejs-lodash-c733a3b\lodash.custom.min.js lodash.min.js
vendor\node_modules\.bin\uglifyjs.cmd --no-copyright --verbose --output main.min.js main.js