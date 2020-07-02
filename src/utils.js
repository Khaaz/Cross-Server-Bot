'use strict';

const { enhanceMention } = require('./enhancedMention');


// const FILTER_USERNAME_REGEX = /[A-Za-z0-9_!? -,.éè]*/g;
// const AUTHOR_MAX = 32;

exports.MESSAGE_LIMIT = 2000;
const LIMIT = 30;


/**
 * Sanitize username in order to have discord supported webhook username.
 * Discord now should allow any username to be usable in webhooks.
 *
 * @param {*} username
 * @returns
 */
function filterUsername(username) {
    return username;
    // let usr = username.match(FILTER_USERNAME_REGEX).join('');
    // if (usr.length < 2) {
    //     for (let i = 0; i < 2 - usr.length; i++) {
    //         usr = `${usr}a`;
    //     }
    //     return usr;
    // }
    // if (usr.length > AUTHOR_MAX) {
    //     return usr.slice(0, AUTHOR_MAX);
    // }
    // return usr;
}

exports.triggerWH = async function (bot, network, channelConfig, originConfig, user, content) {
    const guildObj = bot.guilds.get(channelConfig.guildID);
    let message = null;
    try {
        const username = filterUsername(user.username);
        message = await bot.executeWebhook(channelConfig.whID, channelConfig.whToken, {
            username: `${originConfig.identifier}${username}#${user.discriminator}`,
            avatarURL: user.avatarURL,
            content: enhanceMention(content, guildObj),
            wait: true,
            auth: true,
        } );
    } catch (err) {
        const errMsg = guildObj
            ? `WebHook unavailable in ${guildObj.name}.`
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
