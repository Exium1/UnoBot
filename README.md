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
