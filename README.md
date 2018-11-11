# Cross-Server-Bot
A Cross-Server bot script that works with Eris library.
Link channels between them easily using webhooks and by just completing the json file.

## Features
  - Link as many channels as you want between them.
  - Instant redirection of messages.
  - Usage of webhooks to simulate users (good looking and easy to understand chat).
  - Support images.
  - Warn if a server supposed to be in the linked channels is not here anymore or if a webhook is falsy.

## Setup
Clone this repository.  
Run `npm install` or `yarn`.  

Copy and paste `config.template.json` as `config.json`.  
Enter your bot token and all correct informations: 
```js
{
    "token": "botToken",
    "guilds": {
        "youGuildName": {
            "guildID": "111111",
            "channelID": "121212",
            "whID": "232323",
            "whToken": "webhookToken2323"
        },
        "otherGuildName": {
            "guildID": "444444",
            "channelID": "454545",
            "whID": "56565656",
            "whToken": "webhookToken5656"
        }
    }
}
```
You can enter here as many guilds as you want. Make sure webhooks and channels are valid.  

To start the bot once everything is ready, you can do: 
  - `npm start` or `yarn start` to run the bot normally.
  - `npm pm2start` or `yarn pm2start` to run the bot with pm2.
