#!/bin/bash

ANT_OPTS="-D\"file.encoding=UTF-8\" -D\"java.net.preferIPv4Stack=true\""

ant -lib "./tools/jakarta-oro-2.0.8.jar" -lib "./tools/commons-net-1.4.1.jar" -lib "./tools/jsch-0.1.48.jar" $@

