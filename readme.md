# Perfite

Problématique: Conception / Développement d'une solution de monitoring
de perfs coté clients.

- Récupération des métriques
- Exploitation, affichage et gestion des métriques au niveau d'une
  application web ou dashboard.

## TODO

Misc stuff to do. Bug or stuff to workaround.

- Only using PhantomJS. Investigate & see how to run browsertime with
  Chrome / FF on slaves (and IE/Ie driver on a win box)

- Global default configuration (Jenkins URL, Graphite server / port,
  etc.)

- ...

## Components

The solution relies on the following projects:

- sitespeed.io
- jenkins
- graphite
- dashing

## Description

The goal is to setup comprehensive frontend monitoring to gather metrics at the cliend-side level of web applications.

Monitoring can consist of simple metrics measurement, or more complex functional scenario. It usually consists in a list of URLs, analyzed at a fixed interval, where metrics are send and aggregated by Graphite.

The result is then displayed in a custom frontend dashboard on top of Graphite & Jenkins, to display and manage graphs and alerting based on those metrics.

## Workflow

The basic workflow would consist of:

1. Creating a new logical group: A git repository with a `urls.txt` file, a job `config.xml` file and other metedata informations for the webapp.

2. Creating a new Jenkins job from template: By setting up the SCM configuration to the above git repository, with a specific cron interval (default: 15min)

3. Done ?

## CLI Tool

A CLI tool has to be developped to ease the process of setting up a new Git repo in the proper directory structure, and the creation of the corresponding Jenkins job.

Something like:

**Repo creation**

    # Create a new git repo
    $ perfite new r8-monitoring
       creates urls.txt
       creates job.xml
       creates index.html
       create package.json

    $ cd r8-monitoring

    # or git push origin master
    $ perfite save

**CI Setup**

    $ cd r8-monitoring

    # Creates a new job on Jenkins for this repo
    $ perfite ci

    # Takes an optional name argument (default to dirname)
    $ perfite ci r8-monitoring

Once created, the config.xml file is posted to `/job/$name/config.xml`. So you can edit the config.xml file locally, and run `perfite ci` to persist the change on Jenkins.

**Note**: Doing so, any changes made through the Jenkins web UI would be overwritten by your changes.

You can control:

- the URLs are monitored with `urls.txt` file (one URL per line)
- The cron configuration with `config.xml` build triggers section (see below)
- The Graphite server / port and prefix values for the metrics with `config.xml` parameters section (see below)

*How to change the cron configuration ?*

Open config.xml file and look for the following section:

    <triggers>
      <hudson.triggers.TimerTrigger>
        <spec>H/15 * * * *</spec>
      </hudson.triggers.TimerTrigger>
    </triggers>

Edit the `<spec>...</spec>` part and run `perfite ci` to update the remote job.

*How to change the default job parameters ?*

Open config.xml file and look for the properties section:

    <properties>
      <hudson.model.ParametersDefinitionProperty>
        <parameterDefinitions>
          <hudson.model.StringParameterDefinition>
            <name>GRAPHITE_SERVER</name>
            <description>Remote graphite server to send data to</description>
            <defaultValue>192.168.33.10</defaultValue>
          </hudson.model.StringParameterDefinition>
          <hudson.model.StringParameterDefinition>
            <name>GRAPHITE_PORT</name>
            <description></description>
            <defaultValue>2003</defaultValue>
          </hudson.model.StringParameterDefinition>
        </parameterDefinitions>
      </hudson.model.ParametersDefinitionProperty>
    </properties>

You can add new parameter definitions or change the name / default values etc.
here. Save the file and persist the changes with `perfite ci`.

### Local Dev

We use Vagrant locally to setup the various part of the system. For now,
you'll need to cd into each repository and `vagrant up` to get started, we'll
rework them into a mutli VM Vagrantfile.

#### Graphite

    # Setup the Graphite server
    cd graphite
    vagrant up

    # Check dashboard: http://192.168.33.33
    # Check metrics: http://192.168.33.33/metrics/index.json

    # Check carbon is started:
    vagrant ssh
    sudo service carbon-cache status

    # Test carbon
    sudo yum install nc -y
    echo "local.random.diceroll 4 `date +%s`" | nc localhost 2003

#### Jenkins

  cd jenkins
  vagrant up

  # Check Jenkins: http://localhost:8082 or http://192.168.33.11:8082

#### Jenkins Slave

  cd jenkins-slave
  vagrant up

Then create and connect the node to Jenkins master: http://localhost:8082/computer/new

1. Choose a name for the node
2. Choose "Dumb slave"
3. Click next
4. In "Remote working directory" put: /home/vagrant
5. In "Launch method", choose "Launch slave agents on Unix machines via SSH"
6. Host: 192.168.33.30
7. Credentials: vagrant/vagrant
8. Click save


