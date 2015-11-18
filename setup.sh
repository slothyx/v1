apt-get update
apt-get -y install apache2
apt-get -y install tomcat7

cd /etc/apache2

rm -r sites-enabled

ln -s /vagrant/config/apache sites-enabled

cd mods-enabled
ln -s ../mods-available/proxy.conf proxy.conf
ln -s ../mods-available/proxy.load proxy.load
ln -s ../mods-available/proxy_http.load proxy_http.load

cd /var/lib/tomcat7
rm -rf webapps
ln -s /vagrant/config/tomcat/ webapps
