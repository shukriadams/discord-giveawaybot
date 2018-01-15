# discord-giveawaybot

[![Build Status](https://travis-ci.org/shukriadams/discord-giveawaybot.svg?branch=master)](https://travis-ci.org/shukriadams/discord-giveawaybot)

Gives away Steam games on Discord. Heavily inspired by https://github.com/jagrosh/GiveawayBot

## Requirements

- NodeJS 7 or greater.

## Create your bot on Discord first

- go to https://discordapp.com/developers/applications/me
- click on "new app"
- follow the instructions and create your app, normally you need to add only a name
- after creating your app, click on "create a bot user", this converts your app to a bot (a good thing)
- on the bot's config page, click on "click to reveal token", copy this, and keep it handy for the next step

## Host your bot

There are three ways to host your bot. In all cases, first create a sub folder called "discord-giveawaybot" in the root folder you're working from, to this sub folder copy exampleSettings.json, rename to settings.json, and add your bot token from Discord.

### From Docker image

- Create a docker-compose.yml file 

        version: "2"
        services:
          node:
            container_name: discordgiveawaybot
            image: shukriadams/discord-giveawaybot:latest
            restart: unless-stopped
            command: npm start
            volumes:
            - ./discord-giveawaybot/:/usr/giveawaybot/discord-giveawaybot/:rw

- Run 

        docker-compose up -d

These settings can of course be tweaked to suite your host setup, only npm start and the volume map are required.

### From NPM

- Install

        npm install discord-giveawaybot --save
    
- Run  

        let Bot = require('discord-giveawaybot'),
            bot = new Bot();

        bot.start();

### From source

- Clone this repo.
- Run
    
        npm install
        npm start


## Add your bot to your Discord server

- back on your app's Discord config page (from the first section above), copy your bot's client id and paste it into
  this url, replacing YOURCLIENTID :

      https://discordapp.com/oauth2/authorize?&client_id=YOURCLIENTID&scope=bot&permissions=0

- then navigate to that url in a browser. You'll get the option to add it to your Discord server. After doing this you
should see your bot as a user on your server.
- Your bot needs to know which channel you'll be broadcasting giveaways in. Go to the channel you want to use and write
"@BOTNAME channel" where BOTNAME is whatever name you gave your bot.
- That's it, you're set to go.

## Additional config

By default, only admins can create and manage giveaways. If you want to delegate giveaway responsibilities to non-admins

- go to your Discord server settings and select "roles"
- on the roles page, add a role called "Giveaways". If you don't want to use this name, create any role you want, and
add that name to settings.json (requires bot restart)
- Assign the role "Giveaways" (or whatever you called it) to users who'll run giveaways.

## Commands

One of the major differences between this bot and jagrosh's giveawaybot is that this bot uses direct communication -
you don't talk to it in public chat.

### brackets

Price brackets let you limit how often users can win a game within a price range. If you register a bracket of $0-100,
and a user wins a game that costs $50, that user will automatically be prevented, for seven days, from entering another
giveaway for any game costing between 0 and 100 USD. Brackets are optional - you can register none, one, or as many as
you like.

    brackets 0-20-50-100

sets 3 brackets, 1-20, 20-50 and 50-100. If a game costs 20 USD, it falls in the first bracket that it fits in, 0-20 in
this case. You can start and brackets at any price range. For example

    brackets -b 20-30

sets one bracket, and will catch only games that fall in its range, and a user will be allowed unlimited entry in games
below 20USD or above 30USD.

Prices are always in USD.

For a list of current brackets, use

    brackets

### cancel

Admins or the creator of a giveaway can cancel that giveaway if it hasn't started yet, or is in progress.

### channel

This is the only bot command done in public chat. It registers the channel from which it is sent as the channel in which
giveaways will be broadcast.

### help

Gets a list of commands from the bot.

### list

Lists all ongoing giveaways.

    list all

Shows ongoing and complete and cancelled giveaways.

Additionally, admins and users with giveaway rolls will be able to see pending giveaways.

### me

Tell a user if they're on cooldown for a given bracket if they recently won a game in that bracket.

### queue

Creates a giveaway to be started at some time in the future. Requires admin or giveaway roll. A game activation code
can optionally be added to this command - the winner will receive this code in a private message.

### reroll

An admin or user with giveaway role can reroll a winner on a finished giveaway if they so wish. Note this obviously
doesn't have much meaning if the activation code is attached to the giveaway, as the previous winner will already have
it.

### rules

Simple rules text can be found using

    rules

To set rules text, admin pemission is required. Use

    rules Your text here ...

### start

Immediately starts a giveaway.

### status

This command is currently disabled.

## Other

The bot automatically cleans out completed/cancelled competitions after 14 days.

Get participate emoji characters at http://emojipedia.org

## Development

The bot is basically two processes

- a message handler that receives message instructions from Discord users and responds to them immediately.
- a daemon which ticks at an interval, and which carries out instructions that cannot be handled immediately upon
  receipt.

All other files are helpers for the above.

- Giveaway data is persisted with a local Loki.js store.
- The daemon uses node-cron for its timer.

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

    npm test

or

    cd /tests
    node test

If you want to test with a debugger (Webstorm, VSCode etc), point it to /tests/test.js
