# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/vivid64"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.provision "shell", path: 'setup.sh'
  config.vm.provision "shell", path: 'refresh.sh', run: 'always'
end
