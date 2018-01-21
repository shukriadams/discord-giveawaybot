# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/xenial64"
  config.vm.network "forwarded_port", guest: 9229, host: 9229
  config.vm.network "forwarded_port", guest: 9228, host: 9228

  config.vm.synced_folder "./..", "/vagrant"

  config.vm.provider :virtualbox do |v|
     v.customize ["modifyvm", :id, "--memory", 1048]
  end

  config.vm.provision :shell, path: "provision.sh"
end
