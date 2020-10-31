'use strict';

const { enhanceMention } = require('./enhancedMention');

exports.MESSAGE_LIMIT = 2000;
const LIMIT = 30;

exports.triggerWH = async function (bot, network, channelConfig, originConfig, user, member, content) {
    const guildObj = bot.guilds.get(channelConfig.guildID);
    let message = null;
    try {
        const authorName = member.nick ? member.nick : user.username;
        message = await bot.executeWebhook(channelConfig.whID, channelConfig.whToken, {
            username: `${authorName} from ${originConfig.name}`,
            avatarURL: user.avatarURL,
            //content: enhanceMention(content, guildObj),
            content: content,
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
                } );
            } catch (_) {
                // Do nothing since it would already be handled by another triggerWH
            }
        }
    }
    return message;
};

exports.setInMap = function (map, key, value) {
    map.set(key, value);

    if (map.size > LIMIT) {
        const iter = map.keys();
        while (map.size > LIMIT) {
            map.delete(iter.next().value);
        }
    }
};
