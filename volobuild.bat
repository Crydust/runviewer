@ECHO OFF
PUSHD %~dp0
%~dp0.\node_modules\.bin\volo.cmd build
POPD
