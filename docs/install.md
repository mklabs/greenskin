
## Install

> TODO: Rework install processus etc. This is for production case, work
> an a simpler / local workflow for quick preview

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
