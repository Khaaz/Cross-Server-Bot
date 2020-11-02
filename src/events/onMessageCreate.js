'use strict';

const { deconstructMention } = require('../enhancedMention');
const { triggerWH, setInMap, MESSAGE_LIMIT } = require('../utils');

exports.onMessageCreate = async(botClient, network, channelsCache, msg) => {
    if (!msg.author || msg.author.discriminator === '0000' || !msg.channel.guild) {
        return;
    }

    const cur = network[msg.channel.id];
    if (!cur) {
        return;
    }

    if (msg.author.bot && cur.ignoreBots !== false) { // ignore bots by default (check for false specifically)
        return;
    }

    if (cur.ignore) { // ignore channels if needed
        return;
    }

    const attachments = msg.attachments.length > 0
        ? msg.attachments.map(a => a.url)
        : [];

    const fullLength = `${attachments.join('\n')}\n${msg.content}`.length;
    const fullMsg = [...attachments, ...deconstructMention(msg.content, msg.channel.guild)];


    if (fullLength > MESSAGE_LIMIT) {
        msg.channel.createMessage(`${msg.author.mention}: Message too long!`);
        return;
    }

    const messages = [];
    for (const channelID in network) {
        const channelConfig = network[channelID];
        if (channelConfig.channelID === msg.channel.id) {
            continue;
        }
        messages.push(await triggerWH(botClient, network, channelConfig, cur, msg.author, msg.member, fullMsg));
    }
    setInMap(channelsCache[msg.channel.id], msg.id, messages);
};
