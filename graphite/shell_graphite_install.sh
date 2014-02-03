wget -O /tmp/epel-release-6-8.noarch.rpm http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
rpm -Uvh /tmp/epel-release-6-8.noarch.rpm
yum install git ansible -y

# then run the playbook
echo localhost > /etc/ansible/hosts
ansible-playbook /ansible/playbook.yml --connection=local
