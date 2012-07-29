@ECHO OFF

START "test when changed" /D"%~dp0.\tools" /LOW java -Djava.util.logging.config.file=../config/logging.properties -jar whenchanged.jar ../config/whenchanged.properties
