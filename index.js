const Client = require('eris');
const config = require('./config.json')

const link = {};

const filterUsername = /[A-Za-z0-9_!?{}[\]() -,.]*/g

const bot = new Client(config.token, {
    defaultImageFormat: 'png',
    defaultImageSize: 1024,
    autoreconnect: true,
    messageLimit: 25,
});

bot.connect();

bot.once('ready',() => {
    console.log('Ready!');

    for (const val of Object.values(config.guilds)) {
        const botGuild = bot.guilds.get(val.guildID)
        if (!botGuild) {
            console.log(`Bot not in the guild: ${val.guildID}`)
        } else {
            link[val.guildID] = val;
            bot.executeWebhook(val.whID, val.whToken, {
                username: bot.user.username,
                avatarURL: bot.user.avatarURL,
                content: 'Bot Ready - Cross Server system operational!',
            })
        }
        
    }
})

async function triggerWH(guild, user, content) {
    try {
        const username = user.username.match(filterUsername).join('');
        await bot.executeWebhook(link[guild].whID, link[guild].whToken, {
            username: `${username}#${user.discriminator}`,
            avatarURL: user.avatarURL,
            content: content,
        });
    } catch (err) {
        const botGuild = bot.guilds.get(link[guild].guildID);
        const errMsg = botGuild 
            ? `WebHook unavailable in ${botGuild.name}.`
            : `Guild unavailable: ${guild.guildID}.`
        
        console.log(errMsg);
        
        for (const g in link) {
            if (link[g].guildID === guild.guildID) {
                continue;
            }
            try {
                await bot.executeWebhook(link[g].whID, link[g].whToken, {
                    username: bot.user.username,
                    avatarURL: bot.user.avatarURL,
                    content: errMsg,
                })
            } catch (e) {
                // Do nothing since it would already be handled by another triggerWH
            }
        }
    }
    
}

bot.on('messageCreate', msg => {
    if (!msg.author || msg.author.bot || !msg.channel.guild) {
        return;
    }

    const cur = link[msg.channel.guild.id]
    if (!cur || msg.channel.id != cur.channelID) {
        return;
    }

    const attachments = msg.attachments.length > 0
            ? msg.attachments.map(a => a.url).join('\n')
            : '';

    const fullMsg = `${attachments}\n${msg.content}`
    if (fullMsg.length > 2000) {
        return msg.channel.createMessage(`${msg.author.mention}: Message too long!`);
    }

    for (const guild in link) {
        if (link[guild].guildID === msg.channel.guild.id) {
            continue;
        }
        triggerWH(guild, msg.author, fullMsg);
    }
})

bot.on('messageUpdate', (msg, oldMsg) => {
    // !oldMsg = message not cached = don't log the update
    if (!msg.author || msg.author.bot || !msg.channel.guild || !oldMsg) {
        return;
    }

    const cur = link[msg.channel.guild.id]
    if (!cur || msg.channel.id != cur.channelID) {
        return;
    }

    const attachments = msg.attachments.length > 0
            ? msg.attachments.map(a => a.url).join('\n')
            : '';

    const fullMsg = `${attachments}\n${msg.content} *(edited)*`
    if (fullMsg.length > 2000) {
        return msg.channel.createMessage(`${msg.author.mention}: Message too long!`);
    }

    for (const guild in link) {
        if (link[guild].guildID === msg.channel.guild.id) {
            continue;
        }
        triggerWH(guild, msg.author, fullMsg);
    }
})
