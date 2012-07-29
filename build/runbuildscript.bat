@ECHO OFF

SET antBat=%ANT_HOME%\bin\ant.bat
SET thisDir=%~dp0

PUSHD %thisDir%

SET ANT_OPTS=-D"file.encoding=UTF-8" -D"java.net.preferIPv4Stack=true"

CALL %antBat% ^
    -lib "%thisDir%tools\jakarta-oro-2.0.8.jar" ^
    -lib "%thisDir%tools\commons-net-1.4.1.jar" ^
    -lib "%thisDir%tools\jsch-0.1.48.jar" ^
    %*

POPD
