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
    gs.vm.synced_folder "vms/gs-master", "/opt/kookel/provisioning"
    gs.vm.network :private_network, ip: "192.168.33.12"

    # This will install docker, and hipache (with nodejs, npm, redis <=
    # hipache dependencies). Apart from that, everything is then run within a
    # docker container.
    # gs.vm.provision "shell", path: "vms/gs-master/install.sh"
  end

  # Legacy stuff!
  #
  # Graphite: VM spawning graphite / statsd (not used)
  # Jenkins: VM spawning jenkins solo, no reverse proxy. Direct access to :8080
  # Jenkins-slave: VM spawning jenkins-slave, basic provisioning with packages (node, phantom, etc.)
  #
  # New
  #
  # Jenkins-master: VM with both Jenkins master & node frontend


  config.vm.define "jenkins-master" do |jenkins|
    jenkins.vm.box = "centos63.minimal"
    jenkins.vm.hostname = "jenkins.dev"

    # For CentOS6.5 box
    # jenkins.vm.box_url = "https://github.com/2creatives/vagrant-centos/releases/download/v6.5.1/centos65-x86_64-20131205.box"

    # to be able to run the playbook locally from the VM
    jenkins.vm.synced_folder "vms/jenkins-master/provisioning/", "/ansible"
    jenkins.vm.synced_folder "server", "/opt/kookel/r8_perf"

    jenkins.vm.network "forwarded_port", guest: 80, host: 10080
    jenkins.vm.network "forwarded_port", guest: 3000, host: 13000
    # jenkins.vm.network "forwarded_port", guest: 3000, host: 3000
    jenkins.vm.network "forwarded_port", guest: 8080, host: 18080
    jenkins.vm.network :private_network, ip: "192.168.33.12"

    # jenkins.vm.provision :ansible do |ansible|
    #  ansible.playbook = "vms/jenkins-master/provisioning/jenkins.yml"
    #  ansible.verbose = true;
    # end

    # We use a shell script to run the ansible playbook instead, in local mode
    jenkins.vm.provision "shell", path: "vms/jenkins-master/install.sh"
  end

  config.vm.define "graphite" do |graphite|
    graphite.vm.box = "centos63.minimal"
    graphite.vm.hostname = "graphite.dev"
    graphite.vm.box_url = "https://dl.dropbox.com/u/7225008/Vagrant/CentOS-6.3-x86_64-minimal.box"

    graphite.vm.synced_folder "vms/graphite/ansible-graphite/", "/ansible"

    graphite.vm.network :private_network, ip: "192.168.33.33"

    graphite.vm.network "forwarded_port", guest: 80, host: 18081
    graphite.vm.network "forwarded_port", guest: 2003, host: 12003
    graphite.vm.network "forwarded_port", guest: 8125, host: 18125, protocol: 'udp'

    graphite.vm.provision "shell", path: "vms/graphite/shell_graphite_install.sh"
  end

  config.vm.define "jenkins-slave" do |slave|
    slave.vm.box = "centos63.minimal"
    slave.vm.hostname = "jenkins-slave.dev"
    slave.vm.network :private_network, ip: '192.168.33.30'
    slave.vm.box_url = "https://dl.dropbox.com/u/7225008/Vagrant/CentOS-6.3-x86_64-minimal.box"

    slave.vm.provision "shell", path: "vms/jenkins-slave/install_jenkins_slave.sh"
  end

end
