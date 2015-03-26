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

  config.vm.define "slave" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "greenskin-slave.dev"
    gs.vm.network :private_network, ip: "192.168.33.13"

    gs.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-slave/site.yml"
    end
  end

  config.vm.define "master" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "greenskin-master.dev"
    gs.vm.network :private_network, ip: "192.168.33.12"

    gs.vm.synced_folder "./app", "/var/www/html", type: "nfs"

    gs.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-master/site.yml"
    end

    gs.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-jenkins-configure/site.yml"
    end
  end

  config.vm.define "graphite" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "greenskin-graphite.dev"
    gs.vm.network :private_network, ip: "192.168.33.11"

    gs.vm.provision "ansible" do |ansible|
      ansible.limit = 'all' #https://github.com/mitchellh/vagrant/issues/3096
      ansible.playbook = "vms/ansible-graphite/playbook.yml"
      ansible.host_key_checking = false
      ansible.inventory_path = "vms/ansible-graphite/hosts"
      ansible.extra_vars = { ssh_user: 'vagrant' }
    end
  end

end
