

Not used in current setup. Here as a reference, if we need to base
playbooks etc. on it.

- graphite
- jenkins-master
- jenkins-slave
- jenkins-slave-ubuntu

## Docker

Experimenting with docker. Using vagrant on dev machines to provision
the machines and test it out.

- gs-master - Centos 6.5 VM with docker installed, two containers:
  - app - the node application, exposes 3000 / 8125 ports.
  - jenkins - Jenkins master; exposes 8080 and is mounted on /jenkins/
    path

- gs-slave - VM with n containers. The number varies on what we'll agree
  on. The number of CPU seems a good base.


