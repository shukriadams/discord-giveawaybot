# discord-giveawaybot

[![Build Status](https://travis-ci.org/shukriadams/discord-giveawaybot.svg?branch=master)](https://travis-ci.org/shukriadams/discord-giveawaybot)

A Discord bot that does automated game giveaways. Built-in integration for Steam titles, but can
handle anything connected to a URL. Heavily inspired by https://github.com/jagrosh/GiveawayBot, differs from the
original with :

- bot commands are in private message, allowing for surprise giveaways, direct messaging of game keys to winners,
  detailed data queries and other quiet admin functions
- queuing of future giveaways
- anti-greed features automatically prevents a winner from entering another giveaway for a while
- better Steam integration

A demo version can be seen on Discord: https://discord.gg/gMEGQBj (Bot is limited to non-admin functions, I can't
auto-assign admin rights to users. I'm not active on this Discord channel, it's for demo purposes, if you need help or
found a bug, please use Github).

## Requirements

- An online machine to host your bot on. Your machine doesn't need to be publicly visible to the internet.  
- Either Docker in a Linux environment, or NodeJS 7 or higher.

If you're hosting on Windows : 

- first familiarize yourself with best practices for running NodeJS apps as stable and persistent services on Windows.
- Windows is known to wipe and reset bot state after system crashes or restarts. This is a Windows issue, and will not 
be addressed.
      

## Create your bot on Discord first

- go to https://discordapp.com/developers/applications/me
- click on "new app"
- follow the instructions and create your app - you need to add only a name
- after creating your app scroll down the app page and click on "create a bot user" to convert your app to a bot
- on the bot's config page, copy the bot's client id, you'll need this later. Also click on "click to reveal token",
  copy this too for the next step.

## Host your bot

PLEASE READ THIS CAREFULLY - most setup issues are caused by incorrect folder structure. 

There are several ways to fetch the bot's code. Regardless of which you use, you need to :

1. Create a root folder for your bot. 

        mkdir myBot

   This is where you'll put either docker-compose.yml, or the code from this project if you downloaded the bot code 
   from github directly. If the latter, *you should see package.json in this folder*.

2. In the root folder create a *work folder* called "discord-giveawaybot"

        mkdir myBot/discord-giveawaybot
        
   This is where the bot writes its own volatile files.

3. In the *work folder*, create a settings file. If you're on Linux, you can use 

        touch myBot/discord-giveawaybot/settings.json
        
    The bot will write to this file too.
    
4. In the root of this Github project you'll find exampleSettings.json, copy its contents to the settings file from
the step above, and replace "ADD YOUR BOT TOKEN HERE" with the Discord bot token you copied in 
"Create your bot on Discord first" above. Remember to use the token, not the client id.


## Getting the bot code 

You can get the bot code in three different ways. 

### 1) From Docker image

This is the recommended method because it's easiest to setup and update. Create a docker-compose.yml file in
your bot root folder and add the following to it

    version: "2"
    services:
      node:
        container_name: discordgiveawaybot
        image: shukriadams/discord-giveawaybot:latest
        restart: unless-stopped
        command: npm start
        volumes:
        - ./discord-giveawaybot/:/usr/giveawaybot/discord-giveawaybot/:rw

In the root folder run

    docker-compose up -d

These settings can of course be tweaked to suite your host setup, only npm start and the volume map are required. Bot 
state is in ./discord-giveawaybot, back this up if desired.

### 2) From NPM

Install

        npm install discord-giveawaybot --save
    
Run
        npm start

### 3) From source

Clone this repo, then run
    
        npm install
        npm start

**Keep-alive**

If you're not hosting with Docker, you need to restart the bot process when it unexpectedly exits. [pm2]
(http://pm2.keymetrics.io/) is an excellent option. 

You can also set the bot up as a service

    [Service]
    WorkingDirectory=/path/to/bot/package.json
    ExecStart=/usr/bin/npm start
    Restart=always
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=giveaway
    User=YOURUSER
    Group=YOURGROUP
    Environment=NODE_ENV=production

You can use whatever you prefer, just as long as you handle exits, as the bot _will_ exit 
periodically.

## Add your bot to your Discord server

- back on your app's Discord config page (from the first section above), use the bot client id you copied and paste it
into this url, replacing YOURCLIENTID

      https://discordapp.com/oauth2/authorize?&client_id=YOURCLIENTID&scope=bot&permissions=0

- then navigate to that url in a browser. You'll be able to select which of your Discord servers you want to add it to.
After doing this you should see your bot as a user on your server.
- Your bot needs to know which channel you'll be broadcasting giveaways in. Go to the channel you want to use and write
"@BOTNAME channel" where BOTNAME is whatever name you gave your bot.
- That's it, you're set to go.

## Additional config

By default, only admins can create and manage giveaways. If you want to delegate giveaway responsibilities to non-admins

- go to your Discord server settings and select "roles"
- on the roles page, add a role called "Giveaways". If you don't want to use this name, create any role you want, and
add that name to settings.json (requires bot restart)
- Assign the role "Giveaways" (or whatever you called it) to users who'll run giveaways.

Your bot should always have the permission _Manage Messages_. It gets assigned this by default, so you don't have to 
set it, but do not disable it.  

## Response Emoji

When a giveaway starts, the bot will publish a message in the giveaway channel, along with an emote. Users should click the emote to join the giveaway. The emote is set in settings.json as the "joinGiveawayResponseCharacter" property. This value _must_ be a valid emote that Discord supports. You can get a list of emotes at any site that lists them, one example is

https://getemoji.com

Note that emotes are single ASCII emoji characters, so the emoji for smile must be "🎉", and not ":fanfare:" (or whatever that emoji is called)

## Commands

One of the major differences between this bot and jagrosh's giveawaybot is that this bot uses direct communication -
you don't talk to it in public chat.

### brackets

Price brackets let you limit how often users can win a game within a price range. If you register a bracket of $0-100,
and a user wins a game that costs $50, that user will automatically be prevented, for seven days, from entering another
giveaway for any game costing between 0 and 100 USD. Brackets are optional - you can register none, one, or as many as
you like.

    brackets -b 0-20-50-100

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
received the code, so use common sense.

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

## Known issues

- The bot can handle a maximum of 100 participants per giveaway. Anyone above that 100 will be ignored - this is a
limitation in Discord's API, and will be fixed when Discord fixes their API. As a workaround, a giveaway will
automatically end when it reaches 100 participants.

- The bot can lose giveaways on Windows systems after a system crash or reset. The exact cause isn't known but is 
assumed to be Windows system restore.  


## Monitoring

If you expose your bot process to HTTP traffic, it will reply to /status queries with an integer indicating how 
responsive/overloaded the daemon is. A healthy bot should return 0, if this number is greater than 0 your bot is in 
trouble.    

HTTP traffic is disabled by default, to enable it add the following to settings.json

    "enableHealthMonitor" : true

The default port the bot listens on is 8080, set some other port with 

    "healthMonitorPort" : 3000

So using the settings above and assuming your bot is hosted at https://mybot.example.com, the status call would be

    https://mybot.example.com:3000/status
   

## Development

See the setup procedure for standard deployment above to get your dev bot running - you'll need to create a /discord-giveawaybot work folder and settings.json file in that, get a valid discord bot user access token etc.

The bot is basically two processes

- a message handler that receives message instructions from Discord users and responds to them immediately.
- a daemon which ticks at an interval, and which carries out instructions that are not directly driven by incoming user
  messages

All other files are helpers for the above. Other stuff :

- Giveaway data is persisted with a local Loki.js store, in /discord-giveawaybot/__store
- Errors are logged out with Winston in /discord-giveawaybot/__logs
- The daemon uses node-cron for its timer.

If you use Vagrant, the included vagrant script will start an Ubuntu VM ready to run the bot (for development or
testing).

    cd /vagrant
    vagrant up
    vagrant ssh

Then in the VM run

    yarn --no-bin-links (flag needed only if your host machine is Windows)
    node start (or npm start)

If you want to run the bot directly on your host system without yarn

    npm install
    node start (or npm start)

## Tests

    npm test

or if you want to test with a debugger (Webstorm, VSCode etc), point your debugger to /tests/test.js and

    cd /tests
    node test
