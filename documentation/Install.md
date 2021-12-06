# Installation

This guide will cover how to set up and run UnoBot on your machine or server. For now this guide will only be for Linux operating systems but a Windows tutorial should/will be added later.

## Discord Developer portal

---

Wether you're setting up the bot on Linux or Windows, the very first step is to tell Discord we have a new bot. We do this by creating an "application" in the [Discord Developer Portal](https://discord.com/developers/applications).

1. Go to the developer portal and login
2. Click "New application
3. Enter a name (eg. My UnoBot)
4. Add a bot to the new application by going to the "Bot" settings on the left and clicking "Add Bot"
5. Scroll down to "Priviliged Gateway Intents" and enable the "Message content intent"
6. On this page you can edit the bot icon and you'll find the bot token, keep this page open as you will need this token later on.

Now that we have created our bot account, we can now add this bot to our server, to do this we will need to create a invite link.

1. Go to the "OAuth2" settings on the left and go to "URL Generator"
2. In the scopes list, click on "bot", a new list should appear.
3. Now select the following permissions:
   - Manage roles
   - Manage channels
   - Read messages
   - Send messages
   - Manage messages
   - Embed links
   - Attach files
   - Read message history
   - Add reactions
4. Copy and visit the link in a browser and select the server you want to add the bot to.

Once done this the bot should be in your server and it should appear offline as we haven't started the bot yet.

## Linux

---
The following guide is based upon an Ubuntu 20.04 distro. For other distributions, a link to a similar tutorial will be provided when possible.
The following commands should be issued from a terminal unless specified otherwise.

### **Node.js and npm** - [Tutorial for other distros](https://linuxconfig.org/install-npm-on-linux)

UnoBot is written in JavaScript so we will need to install Node.js to run this bot and npm to install the needed dependencies.

The installation of these 2 is pretty straight forward:

```bash
 sudo apt update
 sudo apt install nodejs npm
 ```

Once done, verify the installation by running:

```bash
nodejs --version
```

### **MongoDB** - [Tutorial for other distros](https://docs.mongodb.com/manual/installation/) / [Mac OS X](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)

UnoBot uses a MongoDB database to store certain stats. In this section we will install MongoDB Community Edition locally. If you are familiar with, and want to use MongoDB Atlas you can skip this section (no tutorial for MongoDB Atlas will be provided here).

1. Import the public key used by the package management system

    ```bash
    wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
    ```

    This should respond with `OK`
2. Create a list file for MongoDB

     ```bash
     echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
     ```

3. Reload local package databse

    ```bash
    sudo apt-get update
    ```

4. Install the MongoDB packages

    ```bash
    sudo apt-get install -y mongodb-org
    ```

5. Start MongoDB

    ```bash
    sudo systemctl start mongodb
    ```

    If you receive an error similar to `Failed to start mongod.service: Unit mongod.service not found.` run the following command first:

    ```bash
    sudo systemctl deamon-Reload
    ```

    Then run the start command above again.
6. Verify that MongoDB has started successfully

    ```bash
    sudo systemctl status mongodb
    ```



### **Configure the bot**

In this section we will install and configure the bot on our machine.

1. Install git - [Tutorial for other distros](https://www.atlassian.com/git/tutorials/install-git#linux)

    ```bash
    sudo apt install git
    ```

2. Go to your preferred directory and clone the code

    ```bash
    git clone https://github.com/Exium1/UnoBot.git UnoBot
    ```

3. Go to the utils folder and open `configExample.js` in your favorite editor

    ```bash
    cd UnoBot/utils
    vi configExample.js
    ```

    Fill in the following values:

    - botToken: the bot token found on the Discord Developer Portal page
    - botInviteUrl: the invite link created on the Discord Developer Portal
    - ownerID: Your discord id (a tutorial on how to find this is available [here](https://www.remote.tools/remote-work/how-to-find-discord-id))

    Other values found in this file alter the behaviour of the bot and can, but don't need to, be changed. If you want to change the prefix of the bot this is done here aswel.

    If you use MongoDB Atlas you also will need to change the mongoURI to the connection url of your cluster.

    Close and save the file when done

4. For the bot to recognize this configuration we need to rename this file to `config.js`

    ```bash
    mv configExample.js config.js 
    ```

### **Running the bot**

When all the configuration is done we only need to move to the main directory and install the dependencies:

```bash
cd ..
npm install 
```

Finally, we can run the bot using

```bash
npm start
```

Or if we want to run the bot in the background (a log file will be created named `nohup.out`)

```bash
nohup npm start &!
```

### **Stopping the bot**

To stop the bot simple press `CTRL+C` in the terminal where it's running.

If you used the nohup command to run the bot use the following command to find the processID.

```bash
ps -x | grep node
```

Find the line where it which looks like 

*Important: if you have other node processes running on your machine, make sure you kill the right process*

```bash
<id> pts/0    Sl     0:00 node .
```

And use the id (the first number) in the following command:

```bash
sudo kill <id>
```

