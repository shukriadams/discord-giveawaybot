# discord-giveawaybot

Heavily inspired by https://github.com/jagrosh/GiveawayBot

## Requirements

- Node 7 or greater.
- Yarn (or use npm if you prefer that)

## Setup

If you use Vagrant, the included vagrant script will start an Ubuntu VM ready to run the bot (for development or testing).

    cd /vagrant
    vagrant up
    vagrant ssh

Then in the VM run

    yarn --no-bin-links
    node index

If you want to run it directly on your machine, install Node 7 or higher. Then run 

    npm install
    node index

## Tests

    cd /tests
    node test

## Hosting your bot

You can host your bot on any internet-connected machine on which you can run the bot with Nodejs.

    npm install
    node index

is all you need to setup/start it. I recommend a Linux host with PM2 to ensure your Node process stays up.


## Create a bot on Discord

- in the project, make a copy of examplesSettings.json, and name this settings.json
- go to https://discordapp.com/developers/applications/me
- click on "new app"
- follow the instructions and create your app, normally you need to add only a name
- after creating your app, click on "create a bot user", this converts your app to a bot (a good thing)
- on the bot's config page, click on "click to reveal token", copy this, and paste it into the token field of your local settings.json file

## Add your bot to your Discord server

- back on your app's Discord config page, copy your bot's client id and paste it into this url, replacing <CLIENT ID>
  https://discordapp.com/oauth2/authorize?&client_id=<CLIENT ID>&scope=bot&permissions=0
- then navigate to that url in a browser. You'll get the option to add it to your Discord server. After doing this you should see your bot as a user on your server.
- Your bot needs to know which channel you'll be broadcasting giveaways in. Go to the channel you want to use and write @BOTNAME channel where BOTNAME is whatever name you gave your bot.
- That's it, you're set to go.

## Additional config

By default, only admins can create and manage giveaways. If you want to delegate giveaway responsibilities to non-admins

- go to your Discord server settings and select "roles"
- on the roles page, add a role called "Giveaways". If you don't want to use this name, create any role you want, and add that name to settings.json (requires bot restart)
- Assign the role "Giveaways" (or whatever you called it) to users who'll run giveaways.

## Other

Get participate emoji characters at http://emojipedia.org
