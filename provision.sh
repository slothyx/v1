apt-get update
apt-get -y install apache2

cd /etc/apache2

rm -r sites-enabled

ln -s /vagrant/config sites-enabled