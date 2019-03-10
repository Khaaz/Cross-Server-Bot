'use strict';

const Client = require('eris');
const config = require('./config.json');
const Resolver = require('./Resolver');

const enhancedMention = !!config.enhancedMention;

const link = {};

const FILTER_USERNAME_REGEX = /[A-Za-z0-9_!?{}[\]() -,.]*/g
const TRY_MENTION_REGEX = /(?<=@|#)([!&]?[0-9]+|\S+)[^> ]?/g
const RESOLVABLE_REGEX = /!?([&#])?(.*)/

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


function resolve(resolvable, guild) {
    const toResolve = resolvable.match(RESOLVABLE_REGEX)
    if (!toResolve) {
        return null;
    }

    if (toResolve[1] === '&') {
        return Resolver.role(guild, toResolve[2]);
    }

    return Resolver.member(guild, toResolve[2]) || Resolver.role(guild, toResolve[2]) || Resolver.channel(guild, toResolve[2]);
}

function parse(content, guild) {
    const res = content.match(TRY_MENTION_REGEX);
    if (!res) {
        return null;
    }
    const resolved = resolve(res[0], guild);
    if (!resolved) {
        return null;
    }
    return resolved.mention;
}


function enhanceMention(content, guild) {
    const arr = content.split(' ');
    
    for (const e of arr) {
        const parsed = parse(e, guild);
        if (parsed) {
            e = parsed;
        }
    }
    return arr.join(' ');
}

async function triggerWH(guild, user, content) {
    const guildObj = bot.guilds.get(link[guild].guildID);
    try {
        const username = user.username.match(FILTER_USERNAME_REGEX).join('');
        await bot.executeWebhook(link[guild].whID, link[guild].whToken, {
            username: `${username}#${user.discriminator}`,
            avatarURL: user.avatarURL,
            content: enhancedMention ? enhanceMention(content, guildObj) : content,
        });
    } catch (err) {
        const errMsg = guildObj 
            ? `WebHook unavailable in ${guildObj.name}.`
            : `Guild unavailable: ${guild.guildID}.`
        
        console.log(errMsg);
        console.log(err);
        
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
    if (!msg.author || msg.author.bot || !msg.channel.guild || !oldMsg) { // msg.author -> edge case bug
        return;
    }

    if (oldMsg.content === msg.content) {
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
