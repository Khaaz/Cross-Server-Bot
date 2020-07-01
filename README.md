# Cross-Server-Bot

A Cross-Server bot script that works with Eris library.
Link channels between them easily with an easy and beautiful visual thanks to webhooks.
Supports message delete, update, lock command...

## Features

- Link as many channels as you want between them.
- Instant redirection of messages.
- Support message deletion and message updating
- Usage of webhooks to simulate users (good looking and easy to understand chat).
- Support images.
- Warn if a server supposed to be in the linked channels is not here anymore or if a webhook is falsy.
- EnhancedMention - mention a user/role/channel in another guild easily by simply using `@name` or `#name`.
- ignore - Whether or not to ignore all messages coming from that channel.
- ignoreBots - Whether to accept bots message to gothrough the network. False by default
- Commands
  - lock - Lock the current channel (remove sendMessage for everyone role): `c!lock`
  - lock all - Lock all channels in the network: `c!lock all`
  - unlock - Unlock the current channel: `c!unlock`
  - unlock all - Unlock all channels: `c!unlock all`
  - commands are usable by poeple with roles in managerRoles only.

## Setup

Clone this repository.  
Run `npm install` or `yarn`.  

Copy and paste `config.template.json` as `config.json`.  
Enter your bot token and all correct informations:

```js
{
    "token": "botToken",
    "prefix": "c!",
    "enhancedMention": {
        "user": false,
        "role": false,
        "channel": false
    },
    "messageDelete": true,
    "deleteOnUpdate": true,
    "guilds": {
        "youGuildName": {
            "name": "name",
            "identifier": "",
            "guildID": "111111",
            "channelID": "121212",
            "whID": "232323",
            "whToken": "webhookToken2323",
            "ignore": false,
            "ignoreBots": true,
            "managerRoles": []
        },
        "otherGuildName": {
            "name": "name",
            "identifier": "",
            "guildID": "444444",
            "channelID": "454545",
            "whID": "56565656",
            "whToken": "webhookToken5656",
            "ignore": false,
            "ignoreBots": true,
            "managerRoles": []
        }
    }
}
```

You can enter here as many guilds as you want. Make sure webhooks and channels are valid.  

The enhancedMention system makes the bot automatically resolve users, roles, channels in every guild if tried to be mentioned in another guild.  
For instance if you type a message with `@user` in your guild but this user is not in your current guild but only in an other guild connected through the cross server system, it will mention the user in this other guild.  

To start the bot once everything is ready, you can do:

- `npm start` or `yarn start` to run the bot normally.
- `npm pm2start` or `yarn pm2start` to run the bot with pm2.
