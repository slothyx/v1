# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/vivid64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", path: 'provision.sh'
  config.vm.provision "shell", inline: 'systemctl restart apache2', run: 'always'
end
