
## Local Dev (with vagrant)

We use Vagrant locally to setup the various part of the system. For now,
you'll need to cd into each repository and `vagrant up` to get started, we'll
rework them into a mutli VM Vagrantfile.

```
Apache proxypass config

/             => node app
/jenkins      => jenkins
```

Forwarded ports:

```
[jenkins-master] -- 22 => 2222 (adapter 1)
[jenkins-master] -- 80 => 10080 (adapter 1)
[jenkins-master] -- 3000 => 13000 (adapter 1)
[jenkins-master] -- 8080 => 18080 (adapter 1)
```

#### Jenkins / Node app

Using vagrant, and the `jenkins-master` VM.

    vagrant up

Check Jenkins: http://localhost:8082 or http://192.168.33.12:8082
Check nodeapp: http://192.168.33.12 or http://192.168.33.12:3000

Services

    sudo service httpd {start|stop|status}
    sudo service jenkins {start|stop|status}

Check that these plugins are installed at http://192.168.33.12/jenkins/pluginManager/

- Simple Theme Plugin
- jQuery Plugin
- TAP Plugin
- Parameterized Trigger Plugin

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

#### Node app

cd into `s4/` and install dependencies.

    cd s4/
    npm i
    cd plugins/phantomas
    npm i

Ensure the Jenkins config in package.json is correct and match the
correct host:

    "config": {
      "jenkins": "http://192.168.33.12:8080/jenkins",
      "jenkinsUI": "http://192.168.33.12:8080/jenkins"
    }

Run the app with the following command

    DEBUG=gs* node bin/www

#### First job

Click on the "Create job (simple metrics)" button and fill the form.
