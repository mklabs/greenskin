
## Vagant Jenkins

Development VM & playbook to provision a new VM with latest Jenkins from
EPEL.

This playbook also install httpd and setup a simple VirtualHost
configuration listening on port 80 in front of the Jenkins instance.

Apache configuration enable CORS for easy access of Jenkins REST API
accross domains.

### Public network

The Vagrant network configuration relies on a public networkd, asking
DHCP for a new ip.

This comes with the drawback of being forced to update
`provisioning/ansible_hosts` file when running `vagrant up` for the
first time.

1. Init box by running `vagrant up`. Provisioning will fail, it is
   expected.
2. Ssh into the machine with `vagrant ssh` and get the machine IP
   (simple `ifconfig`)
3. Update `provisioning/ansible_hosts` accordingly.
