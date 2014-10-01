# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.provider :virtualbox do |vb, override|
   vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
   vb.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
   # Uncomment for smaller machine, and if launching several VM (graphite & jenkins for instance)
   # vb.customize ["modifyvm", :id, "--memory", 512]
   # vb.customize ["modifyvm", :id, "--cpus", 1]
  end

  config.vm.define "gs-slave" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsslave.dev"
    gs.vm.network :private_network, ip: "192.168.33.13"

    config.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-slave/site.yml"
    end

    config.vm.provision "ansible" do |ansible|
      ansible.inventory_path = "vms/webpagetest/hosts"
      ansible.limit = "all"
      ansible.playbook = "vms/webpagetest/webpagetest-private.yml"
      ansible.verbose = "vv"
    end
  end

  config.vm.define "gs-master" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsmaster.dev"
    gs.vm.network :private_network, ip: "192.168.33.12"

    config.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-master/site.yml"
    end

    config.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-jenkins-configure/site.yml"
    end
  end

end
