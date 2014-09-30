Greenskin ansible
-----------------

Ansible playbooks to provision a new machine for Greenskin.

This repository contains three different playbooks, one for master, one
for slave, and one to configure Jenkins once ready.

1. Run greenskin-slave playbook
2. Run greenskin-master playbook
3. Ensure Jenkins is ready, and run greenskin-jenkins-configure

### greenskin-master

In `playbooks/greenskin-master`.

Performs the base install of the master component, installing Jenkins,
node / npm and the node application.

#### Variables

- jenkins_url: Used to configure the package.json for the node app to
  connect to Jenkins

### greenskin-jenkins-configure

In `playbooks/greenskin-jenkins-configure`.

To run only when Jenkins is ready to work. Jenkins can have a startup
time quite long.

This playbook uses Jenkins jenkins-cli.jar to install plugins, and
configure slaves.

#### Variables

- slave_hostname: Used by slave.xml template to configure and connect a
  new slave node to Jenkins

### greenskin-slave

In `playbooks/greenskin-slave`.

To provision and install the slave.
