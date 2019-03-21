'use strict';

const Client = require('eris');
const config = require('./config.json');
const Resolver = require('./Resolver');

const enhancedMention = config.enhancedMention || { user: false, role: false, channel: false};

const network = {};

const FILTER_USERNAME_REGEX = /[A-Za-z0-9_!?{}[\]() -,.éè]*/g;
const TRY_MENTION_REGEX = /(?<=((?<!<)@|(?<!<)#))(\S+)/;
const MENTION_REGEX = /<(@&|@|#)!?([0-9]+)>/;

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
            network[val.channelID] = val;
            bot.executeWebhook(val.whID, val.whToken, {
                username: bot.user.username,
                avatarURL: bot.user.avatarURL,
                content: 'Bot Ready - Cross Server system operational!',
            })
        }
        
    }
})

function enhanceMention(contentArr, guild) {
    const final = [];

    for (const e of contentArr) {
        const resolved = typeof e != 'string'
            ? resolve(e, guild)
            : parse(e, guild);

        final.push(resolved);
    }
    return final.join(' ');
}

function resolve(toResolve, guild) {
    if (toResolve.type === 1) { // user
        const resolved = Resolver.member(guild, toResolve.resolved.id);
        return resolved 
            ? resolved.mention
            : `${toResolve.resolved.username}#${toResolve.resolved.discriminator}`;
    }

    if (toResolve.type === 2) { // role
        const resolved = Resolver.role(guild, toResolve.resolved.name);
        return resolved 
            ? resolved.mention
            : `@${toResolve.resolved.name}`;
    }

    if (toResolve.type === 3) { // channel
        const resolved = Resolver.channel(guild, toResolve.resolved.name);
        return resolved 
            ? resolved.mention
            : `#${toResolve.resolved.name}`;
    }
}

function parse(content, guild) {
    const res = content.match(TRY_MENTION_REGEX);
    if (!res) {
        return content;
    }

    let resolved = null;
    if (res[1] === '@') {
        resolved = enhancedMention.role ? Resolver.role(guild, res[2]) : null;
        if (resolved) {
            return resolved.mention;
        }
        resolved = enhancedMention.user ? Resolver.member(guild, res[2]) : null
        if (resolved) {
            return resolved.mention;
        }
        return content;
    }
    if (enhancedMention.channel && res[1] === '#') {
        resolved = Resolver.channel(guild, res[2]);
        return resolved 
            ? resolved.mention
            : content;
    }
    return content;
}

function deconstructMention(content, guild) {
    const contentArr = content.split(' ');
    const final = [];

    for (const e of contentArr) {
        const res = e.match(MENTION_REGEX);
        res
            ? final.push(extractMention(res, guild))
            : final.push(e);
    }
    return final;
}

function extractMention(match, guild) {
    const type = match[1];
    const toResolve = match[2];
    if (type === '@') { // user mention
        const resolved = Resolver.member(guild, toResolve);
        if (!resolved) {
            return match[0];
        }

        return enhancedMention.user 
            ? { type: 1, resolved }
            : `\@${resolved.username}#${resolved.discriminator}`;
    }

    if (type === '@&') { // role mention
        const resolved = Resolver.role(guild, toResolve);
        if (!resolved) {
            return match[0];
        }
        
        return enhancedMention.role 
            ? { type: 2, resolved }
            : `\@${resolved.name}`;
    }
    if (type === '#') { // channel mention
        const resolved = Resolver.channel(guild, toResolve);
        if (!resolved) {
            return match[0];
        }
        
        return enhancedMention.channel 
            ? { type: 3, resolved }
            : `\#${resolved.name}`;
    }
}

function filterUsername(username) {
    const usr = username.match(FILTER_USERNAME_REGEX).join('');
    if (usr.length < 2) {
        for (let i = 0; i < 2 - usr.length ; i++) {
            usr + 'a';
        }
        return usr;  
    }
    if (usr.length > 32) {
        return usr.slice(0, 32);
    }
    return usr;
}

async function triggerWH(channel, user, content) {
    const guildObj = bot.guilds.get(network[channel].guildID);
    try {
        const username = filterUsername(user.username);
        await bot.executeWebhook(network[channel].whID, network[channel].whToken, {
            username: `${username}#${user.discriminator}`,
            avatarURL: user.avatarURL,
            content: enhanceMention(content, guildObj),
        });
    } catch (err) {
        const errMsg = guildObj 
            ? `WebHook unavailable in ${guildObj.name}.`
            : `Guild unavailable: ${guild.guildID}.`
        
        console.log(errMsg);
        console.log(err);
        
        for (const c in network) {
            if (network[c].guildID === guild.guildID) {
                continue;
            }
            try {
                await bot.executeWebhook(network[c].whID, network[c].whToken, {
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

    const cur = network[msg.channel.id]
    if (!cur || msg.channel.id != cur.channelID) {
        return;
    }

    if (cur.ignore) {
        return;
    }

    const attachments = msg.attachments.length > 0
        ? msg.attachments.map(a => a.url)
        : [];

    const fullLength = `${attachments.join('\n')}\n${msg.content}`.length
    const fullMsg = [...attachments, ...deconstructMention(msg.content, msg.channel.guild)]

    if (fullLength > 2000) {
        return msg.channel.createMessage(`${msg.author.mention}: Message too long!`);
    }

    for (const channel in network) {
        if (network[channel].channelID === msg.channel.id) {
            continue;
        }
        triggerWH(channel, msg.author, fullMsg);
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

    const cur = network[msg.channel.id]
    if (!cur || msg.channel.id != cur.channelID) {
        return;
    }

    const attachments = msg.attachments.length > 0
        ? msg.attachments.map(a => a.url)
        : [];

    msg.content += ' *(edited)*'

    const fullLength = `${attachments.join('\n')}\n${msg.content}`.length
    const fullMsg = [...attachments, ...deconstructMention(msg.content, msg.channel.guild)]
    if (fullLength > 2000) {
        return msg.channel.createMessage(`${msg.author.mention}: Message too long!`);
    }

    for (const channel in network) {
        if (network[channel].channelID === msg.channel.id) {
            continue;
        }
        triggerWH(channel, msg.author, fullMsg);
    }
})
