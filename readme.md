# Hermód

Source : mythologie Nordique, Dieu des messagers, il peut aussi courir beaucoup plus vite que tous les autres dieux Asgardiens, rivalisant avec le mutant Vif-Argent et Hermès le dieu grec. 

An express based webapp, sitting on top of Jenkins, to provide a simple monitoring fpr frontend performance.

## Description

Most of the metrics are gathered by Phantomas, instrumented via Jenkins, from optional remote slaves.

The webapp sits in front of Jenkins to provide a simple UI to create predefined and ready to use Jobs and configuration to gather metrics at a set interval.

Monitoring can consist of simple metrics measurement, or more complex functional scenario. It usually consists in a list of URLs, analyzed at a fixed interval, with a set of measures (or asserts) on metrics that Phantomas provides.

The result is then displayed in a custom frontend dashboard on top of Jenkins, to display and manage graphs and alerting based on those metrics.

Jenkins, on a failing assert, generates an email notification.

## Components

Systems

- Expressjs
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


## Install

The app can work with any Jenkins instance, by using a job prefix to help
isolating job related to the frontend monitoring. Though, we recommend using
the standard configuration below, with a dedicated Jenkins instance.

It will setup a server with Apache, as a reverse proxy, in front of both the node app and Jenkins.

```
/             => node app
/jenkins      => jenkins
```

You can change the Jenkins hostname in `server/package.json` file.

### Jenkins / Node frontend

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

### Jenkins Slave

 > TODO: Test and document setup


## Local Dev (with vagrant)

We use Vagrant locally to setup the various part of the system. For now,
you'll need to cd into each repository and `vagrant up` to get started, we'll
rework them into a mutli VM Vagrantfile.

```
Apache proxypass config

/             => node app
/jenkins      => jenkins
```

#### Jenkins / Node app

    vagrant up jenkins-master

Check Jenkins: http://localhost:8082 or http://192.168.33.12:8082
Check nodeapp: http://192.168.33.12 or http://192.168.33.12:3000

Services

    sudo service httpd {start|stop|status}
    sudo service jenkins {start|stop|status}
    sudo service r8_perf {start|stop|status}
  
Logs:

    tail -f /opt/kookel/r8_perf

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