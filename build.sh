#!/bin/bash

mkdir out

#www-data
cp -rf www out/www

#service-backend
mkdir out/service
cp -rf service/web/WEB-INF out/service
mkdir out/service/WEB-INF/classes
javac -cp "service/lib/*" -d out/service/WEB-INF/classes service/src/com/slothyx/*.java
mkdir out/service/WEB-INF/lib
cp service/lib/JSON.jar out/service/WEB-INF/lib

jar cvf out/service.war -C out/service .

cp out/service.war ../service.war