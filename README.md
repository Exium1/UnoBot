<img src="https://cdn.discordapp.com/avatars/565305035592957954/5c252fbb1bfa80e04c811f83e5243e51.png" alt="UnoBot Logo" align="left" style="width:150px; height:150px; display:block; float:right;"/>

# UnoBot

[![](https://img.shields.io/discord/640350242167848964?color=%235865F2&label=UnoBot%20Server&logo=discord&logoColor=%235865F2&style=flat-square)](https://discord.gg/xYtCqnX) [![](https://img.shields.io/github/package-json/v/abalabahaha/eris/dev?color=%232772b2&style=flat-square&label=Eris)](https://github.com/abalabahaha/eris/tree/dev)

UnoBot is a Discord Bot that allows servers to play Uno entirely within their text-channels.

# Self-Hosting Guide

Learn how to install UnoBot on your system and self-host it! If you need help with self-hosting, ask your questions in the **#self-hosting** channel in the UnoBot Discord server!

## Creating the application

The first thing you need to do is make a new application, kind of a custom account for the bot. This is done through the Discord Developer Portal.

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    - Open https://discord.com/developers/applications
    - Sign in if prompted and go back to the Discord Developer Portal.
2. Click "New Application."
    - Click on the blurple button with "New Application" at the top right.
3. Enter a name for your application.
    - When prompted, enter a name for this application, like "UnoBot."
4. Click on "Bot" on the left navigation bar.
5. Click on "Add Bot."
    - Click on the blurple button with "Add Bot" at the top right.
    - Click "Yes" if prompted to confirm adding a bot.
6. Enable "Message Content Intent."
    - Scroll down to "Message Content Intent" and enable it by clicking on the toggle button.
7. Customize if wanted.
    - Feel free to change the bot's icon or the bot's username.
    - You can also disable "Public Bot" to prevent others from adding the bot to their servers.
8. Keep track of the bot's token.
    - **The token will be used later on to connect the program to the bot you just created.**
    - You can either copy the token or keep this tab open for when you need it.
    - Make sure to never share your token as people could gain access to your bot if acquired.
9. Click on "OAuth2" on the left navigation bar, then "URL Generator" underneath it.
10. Check the "Bot" box listed in the scopes.
11. Check the following permissions boxes.
    - Manage Roles
    - Manage Channels
    - Read Messages/View Channels
    - Send Messages
    - Manage Messages
    - Embed Links
    - Attach Files
    - Read Message History
    - Add Reactions
12. Copy and open the URL.
    - After checking the permissions click on "Copy" next to the invite URL.
    - Use that URL to invite your bot like any other.
13. Confirm the bot was invited.
    - Check on the server you invited your bot to.
    - It should be added, but offline, as it is not running yet.

## Windows

Follow this if you're self-hosting the bot on Windows, as the installation is different on other operating systems.

### Node.js

Node.js is a program needed to run the JavaScript on your machine.

1. Go to the [Node.js website](https://nodejs.org/en/).
    - Open https://nodejs.org/en/.
2. Download the LTS version.
    - The Long Term Support version is recommended for most users.
3. Install Node.js
    - After downloading, open the download and follow the download instructions.
    - The installation is relatively easy, but a reboot may be required.

### MongoDB

MongoDB is the database the bot will be using to store information like ongoing games and user options. For this installation, the Community version will be used as it will be a local database and not accessible online.

1. Go to the [MongoDB website](https://www.mongodb.com/try/download/community).
    - Open https://www.mongodb.com/try/download/community.
2. Download the MongoDB Community Server.
    - Click on the green download button on the right side.
    - Set the version to current and platform to Windows.
    - Choose either package, whichever is easier for you.
3. Install MongoDB.
    - After downloading, open the download and follow the download instructions.
    - If asked, select the complete installation, as it is recommended for most users.
4. Open MongoDB Compass.
    - If not automatically opened after installation, manually open MongoDB Compass.
5. Click "Connect" to make a new connection.
    - Even if the box and string are empty, click on "Connect."
    - A new connection should be created.
6. Make a database called "UnoBot"
    - Click on the green "Create database" button.
    - Set the Database Name to "UnoBot"
    - Set the Collection Name to "games"
    - Leave the boxes unchecked.
    - Click on "Create database" to confirm creation.
    - You should see your "games" collection listed. Note other collections will be automatically added once the bot begins to run.
7. MongoDB info
    - For the bot to work properly, the database needs to be running. However, this does not mean the MongoDB Compass window needs to be open.
    - The database should automatically run in the background.

### Download and configure the code

Now we will download the code off GitHub and set it up with your custom info.

1. [Download the code](https://github.com/Exium1/UnoBot/archive/refs/heads/master.zip).
    - You need to download the code, which can be found on the UnoBot repository on GitHub.
    - https://github.com/Exium1/UnoBot/archive/refs/heads/master.zip
2. Extract the .zip file.
    - Right-click on the file and click "Extract All."
    - Save the extracted folder to a location you can access again, like your desktop.
3. Open the configExample.js file.
    - Navigate to the file through "Desktop\UnoBot-master\utils\configExample.js"
    - Open up the file called configExample.js with any text editor, Notepad works.
4. Add your bot token.
    - Remember the token you got when you created the application? Now is the time to get that.
    - You can go back to that tab and copy the token if it's still open.
    - If you closed the [Discord Developer Portal](https://discord.com/developers/applications), reopen it and go to your bot, find, reveal, and copy your token.
    - With your token, paste it between the empty double quotes labeled "botToken."
5. Customize your info.
    - In this file, you can change the ownerID, default prefix, default language, and more.
    - Nearly all of these fields are optional.
6. Rename the file to "config.js"
    - Once you're done with adding the token and optional customizations, save your file.
    - Navigate to the file and rename it to "config.js"
    - You can still change the info in the file.
7. Open up the command prompt.
    - Search for the "command prompt" in Windows search and open it.
8. Navigate to your UnoBot folder in the command prompt.
    - This may be confusing and slightly challenging for people new to the command prompt, but don't worry!
    - On the left of your blinking cursor, the current directory is shown.
    - To change directories, you can use the `CD` command followed by the path of the desired folder.
    - To get the location of the folder, you can open the UnoBot folder with file explorer and click on the small folder icon between the up arrow and the folder name near the top.
    - Copy this path and enter it in your command prompt like so: `CD C:\Users\Exium\Desktop\UnoBot-master`.
    - The command prompt directory should be updated.
9. Install the dependencies.
    - In the command prompt set to your UnoBot folder, type and enter `npm i`.
    - This will download the dependencies required for the bot to run.
    - If you got any error during the installation **jump to (I)** otherwise **jump to (II)**.
    - **(I)**
        - If you got any error, that means that you don't have the libraries pre-installed to run `node-gyp`.
        - Go to [Microsoft Visual Studio](https://visualstudio.microsoft.com/es/thank-you-downloading-visual-studio/?sku=Community) and install the LTS.
        - Once you have the installation, find the **Desktop Development with C++** and check it. Then continue the installation with any Visual Studio Code version (Proffesional, Community), it doesn't matters.
        - The installation (can weigh up 8GB) contains all the C++ libraries to run `node-gyp`.
        - After the installation, please close the command prompt and do the same proccess from **step 7**.
    - **(II)**
        - After it has finished installing, you are free to close the command prompt.

### Run your bot

Now with everything installed and customized, you should be able to launch your bot.

1. Open "launch.bat" to start.
    - Navigate to your UnoBot folder where your code was extracted to.
    - Open the file called "launch.bat" or "launch"
    - Note the window that appears is necessary to keep the bot online.
2. Verify it's working.
    - Go to the Discord server you added the bot to and test it out.
    - Use a command like `u!commands` to make sure it is working.
    - If you are stuck, ask your questions in the #self-hosting channel in the Discord Server.
3. Close to stop.
    - If you want to stop the bot at any time, you can close the window.
    - You can also do `CTRL + C` to close the window.
    - It may take a minute or two for the bot to appear back offline.


## Linux


The following guide is based upon an Ubuntu 20.04 distro. For other distributions, a link to a similar tutorial will be provided when possible.
The following commands should be issued from a terminal unless specified otherwise.

### Node.js and npm - [Tutorial for other distros](https://linuxconfig.org/install-npm-on-linux)

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

### MongoDB - [Tutorial for other distros](https://docs.mongodb.com/manual/installation/) / [Mac OS](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)

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



### Configure the bot

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

### Running the bot

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

### Stopping the bot

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

