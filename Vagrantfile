# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.define "graphite" do |graphite|
    graphite.vm.box = "centos63.minimal"
    graphite.vm.hostname = "graphite.dev"

    graphite.vm.synced_folder "graphite/ansible-graphite/", "/ansible"

    graphite.vm.network :private_network, ip: "192.168.33.33"

    graphite.vm.network "forwarded_port", guest: 80, host: 8080
    graphite.vm.network "forwarded_port", guest: 2003, host: 2003
    graphite.vm.network "forwarded_port", guest: 8125, host: 8125, protocol: 'udp'

    graphite.vm.provision "shell", path: "graphite/shell_graphite_install.sh"
  end

  config.vm.define "jenkins" do |jenkins|
    jenkins.vm.box = "centos63.minimal"
    jenkins.vm.hostname = "jenkins.dev"

    jenkins.vm.network "forwarded_port", guest: 8080, host: 8082
    jenkins.vm.network :private_network, ip: "192.168.33.11"

    # jenkins.vm.provision :ansible do |ansible|
    #   ansible.playbook = "provisioning/jenkins.yml"
    #   ansible.verbose = true;
    # end

    jenkins.vm.provision "shell", path: "jenkins/install_jenkins.sh"
  end

  config.vm.define "jenkins-slave" do |master|
    master.vm.box = "centos63.minimal"
    master.vm.hostname = "jenkins-slave.dev"
    master.vm.network :private_network, ip: '192.168.33.30'

    #master.vm.provision :ansible do |ansible|
    #  ansible.playbook = "provisioning/jenkins-slave.yml";
    #end

    master.vm.provision "shell", path: "jenkins-slave/install_jenkins_slave.sh"
  end

end
