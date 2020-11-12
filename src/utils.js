'use strict';

const { enhanceMention } = require('./enhancedMention');

exports.MESSAGE_LIMIT = 2000;
const CACHELIMIT = 1000;

exports.triggerWH = async function (bot, network, channelConfig, originConfig, user, member, content) {
    const guildObj = bot.guilds.get(channelConfig.guildID);
    let message = null;
    try {
        const authorName = member.nick ? member.nick : user.username;
        message = await bot.executeWebhook(channelConfig.whID, channelConfig.whToken, {
            username: `${authorName} from ${originConfig.name}`,
            avatarURL: user.avatarURL,
            content: enhanceMention(content, guildObj),
            wait: true,
            auth: true,
        } );
    } catch (err) {
        const errMsg = guildObj
            ? `\`The last message failed to go through to ${guildObj.name}. It might be the bot's fault, or Discord being buggy.\``
            : `Guild unavailable: ${channelConfig.guildID}.`;
        
        console.log(errMsg);
        console.log(err);
        
        for (const c in network) {
            if (network[c].guildID === channelConfig.guildID) {
                continue;
            }
            try {
                await bot.executeWebhook(network[c].whID, network[c].whToken, {
                    username: bot.user.username,
                    avatarURL: bot.user.avatarURL,
                    content: errMsg,
                });
            } catch (_) {
                // Do nothing since it would already be handled by another triggerWH
            }
        }
    }
    return message;
};

exports.triggerWHEdit = async function (bot, network, channelConfig, originConfig, user, member, content, messageID) {
    const guildObj = bot.guilds.get(channelConfig.guildID);
    let message = null;
    try {
        const authorName = member.nick ? member.nick : user.username;
        message = await bot.webhookEditMessage(channelConfig.whID, channelConfig.whToken, messageID, {
            username: `${authorName} from ${originConfig.name}`,
            avatarURL: user.avatarURL,
            content: enhanceMention(content, guildObj),
            wait: true,
            auth: true,
        } );
    } catch (err) {
        const errMsg = guildObj
            ? `\`The last edit failed to go through to ${guildObj.name}. It might be the bot's fault, or Discord being buggy.\``
            : `Guild unavailable: ${channelConfig.guildID}.`;
        
        console.log(errMsg);
        console.log(err);
        
        for (const c in network) {
            if (network[c].guildID === channelConfig.guildID) {
                continue;
            }
            try {
                await bot.executeWebhook(network[c].whID, network[c].whToken, {
                    username: bot.user.username,
                    avatarURL: bot.user.avatarURL,
                    content: errMsg,
                });
            } catch (_) {
                // Do nothing since it would already be handled by another triggerWH
            }
        }
    }
    return message;
};

exports.triggerWHDelete = async function (bot, network, channelConfig, messageID) {
    const guildObj = bot.guilds.get(channelConfig.guildID);
    let result = null;
    try {
        result = await bot.webhookDeleteMessage(channelConfig.whID, channelConfig.whToken, messageID);
    } catch (err) {
        const errMsg = guildObj
            ? `\`The last delete failed to go through to ${guildObj.name}. It might be the bot's fault, or Discord being buggy.\``
            : `Guild unavailable: ${channelConfig.guildID}.`;
        
        console.log(errMsg);
        console.log(err);
        
        for (const c in network) {
            if (network[c].guildID === channelConfig.guildID) {
                continue;
            }
            try {
                await bot.executeWebhook(network[c].whID, network[c].whToken, {
                    username: bot.user.username,
                    avatarURL: bot.user.avatarURL,
                    content: errMsg,
                });
            } catch (_) {
                // Do nothing since it would already be handled by another triggerWH
            }
        }
    }
    return result;
};

exports.setInMap = function (map, key, value) {
    map.set(key, value);

    if (map.size > CACHELIMIT) {
        const iter = map.keys();
        while (map.size > CACHELIMIT) {
            map.delete(iter.next().value);
        }
    }
};
