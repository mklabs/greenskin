# Hermód

Source : mythologie Nordique, Dieu des messagers, il peut aussi courir beaucoup plus vite que tous les autres dieux Asgardiens, rivalisant avec le mutant Vif-Argent et Hermès le dieu grec. 

Problématique: Conception / Développement d'une solution de monitoring
de perfs coté clients.

- Récupération des métriques
- Exploitation, affichage et gestion des métriques au niveau d'une
  application web ou dashboard.

## Components

Systems

- Expressje 
- Jenkins
- Graphite
- PhantomJS
- Phantomas

Frontend

- bootstrap v3
- CodeMirror
- socket.io
- momentjs
- highcharts
- screenfull.js
- jquery-cron
- jsonlint
- select2
- har-viewer
- ansiparse (with a bit of CSS from travis.org)
- cucumber/gherkin

## Description

The goal is to setup comprehensive frontend monitoring to gather metrics at the cliend-side level of web applications.

Monitoring can consist of simple metrics measurement, or more complex functional scenario. It usually consists in a list of URLs, analyzed at a fixed interval, where metrics are send and aggregated by Graphite (or not).

The result is then displayed in a custom frontend dashboard on top of Jenkins, to display and manage graphs and alerting based on those metrics.


### Local Dev (with vagrant)

We use Vagrant locally to setup the various part of the system. For now,
you'll need to cd into each repository and `vagrant up` to get started, we'll
rework them into a mutli VM Vagrantfile.

```
Apache proxypass config

/             => node app
/jenkins      => jenkins
```

#### Graphite

    # Setup the Graphite server
    vagrant up graphite

    # Check dashboard: http://192.168.33.33
    # Check metrics: http://192.168.33.33/metrics/index.json

    # Check carbon is started:
    vagrant ssh
    sudo service carbon-cache status

    # Test carbon
    sudo yum install nc -y
    echo "local.random.diceroll 4 `date +%s`" | nc localhost 2003

#### Jenkins / Node app

  vagrant up jenkins-master

  # Check Jenkins: http://localhost:8082 or http://192.168.33.12:8082
  # Check nodeapp: http://192.168.33.12 or http://192.168.33.12:3000
  #
  # sudo service httpd {start|stop|status}
  # sudo service jenkins {start|stop|status}
  # sudo service r8_perf {start|stop|status}
  #
  # Logs:
  #
  # tail -f /opt/kookel/r8_perf

Check that these plugins are installed at http://192.168.33.12/jenkins/pluginManager/

- Simple Theme Plugin
- jQuery Plugin
- TAP Plugin

#### Jenkins Slave

  vagrant up jenkins-slave

Then create and connect the node to Jenkins master: http://192.168.33.12/jenkins/computer/new

1. Choose a name for the node
2. Choose "Dumb slave"
3. Click next
4. In "Remote working directory" put: /home/vagrant
5. In "Launch method", choose "Launch slave agents on Unix machines via SSH"
6. Host: 192.168.33.30
7. Credentials: vagrant/vagrant
8. Click save


### Install without Vagrant

#### Jenkins / Node frontend

On the machine hosting Jenkins & the node frontend:


    git clone $repo # where $repo is the Git clone URL of this repo
    cd $repo # where $repo is the project name (cloned directory)

    cd vms/jenkins-master
    sh install.sh

Or simply use vms/jenkins-master/install.sh file as a runbook

Check that these plugins are installed at http://$hostname/jenkins/pluginManager/ (where $hostname is the machine FQDN)

- TAP Plugin (required for test reports)
- Simple Theme Plugin (optional, for theming jenkins)
- jQuery Plugin (optional, for theming jenkins)

**Optional**

Go to http://$hostname/jenkins/configure and add these files to custom CSS / JS

    /jenkins-theme/main.css
    /jenkins-theme/main.js
 
 **TODO**

 Consider folllowing https://wiki.jenkins-ci.org/display/JENKINS/Securing+Jenkins

 #### Jenkins Slave

 > TODO: Test and document setup



