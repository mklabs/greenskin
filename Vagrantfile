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

  # Using docker containers.
  #
  # TODO: Use / test vagrant builtin providers or provisioners for docker.
  #
  # Had issue with setting it up (but need further testing, prob my env).
  # Below, we rely on a shell script to provision the machine with docker (yum
  # install from EPEL)
  config.vm.define "gs-master" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsmaster.dev"

    # to be able to run the playbook locally from the VM
    gs.vm.synced_folder "s4", "/opt/kookel/greenskin"
    gs.vm.synced_folder "vms", "/opt/kookel/provisioning"
    gs.vm.network :private_network, ip: "192.168.33.12"

    # This will install docker, and hipache (with nodejs, npm, redis <=
    # hipache dependencies). Apart from that, everything is then run within a
    # docker container.
    gs.vm.provision "shell", path: "vms/jenkins-master/install.sh"
  end

  config.vm.define "gs-slave" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsslave.dev"
    gs.vm.network :private_network, ip: "192.168.33.13"

    gs.vm.provision "shell", path: "vms/jenkins-slave/install_jenkins_slave.sh"
  end

  config.vm.define "gs-slave-ansible" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsslave.dev"
    gs.vm.network :private_network, ip: "192.168.33.15"

    config.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-slave/site.yml"
    end
  end

  config.vm.define "gs-master-ansible" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "gsmaster.dev"
    gs.vm.network :private_network, ip: "192.168.33.14"

    # config.vm.provision "ansible" do |ansible|
    #   ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-master/site.yml"
    # end

    config.vm.provision "ansible" do |ansible|
      ansible.playbook = "vms/greenskin-ansible/playbooks/greenskin-jenkins-configure/site.yml"
    end
  end

  config.vm.define "webpagetest" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "webpagetest.dev"
    gs.vm.network :private_network, ip: "192.168.33.33"

    config.vm.network :forwarded_port, guest: 8080, host: 8086

    config.vm.provision "ansible" do |ansible|
      ansible.inventory_path = "vms/webpagetest/hosts"
      ansible.limit = "all"
      ansible.playbook = "vms/webpagetest/webpagetest-private.yml"
      ansible.verbose = "vv"
    end
  end

  config.vm.define "graphite" do |gs|
    gs.vm.box = "chef/centos-6.5"
    gs.vm.hostname = "graphite.dev"
    gs.vm.network :private_network, ip: "192.168.33.34"

    config.vm.network "forwarded_port", guest: 80, host: 8087
    config.vm.network "forwarded_port", guest: 2003, host: 2003
    config.vm.network "forwarded_port", guest: 8125, host: 8125, protocol: 'udp'

    config.vm.provision "ansible" do |ansible|
      ansible.inventory_path = "vms/graphite/ansible-graphite/hosts"
      ansible.limit = "all"
      ansible.playbook = "vms/graphite/ansible-graphite/playbook.yml"
      ansible.verbose = "vv"
    end
  end



end
