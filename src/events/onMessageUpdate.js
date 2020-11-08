'use strict';

const { deconstructMention } = require('../enhancedMention');
const { triggerWHEdit, setInMap, MESSAGE_LIMIT } = require('../utils');

exports.onMessageUpdate = async(botClient, network, channelsCache, msg, oldMsg) => {
    // !oldMsg = message not cached = don't log the update
    if (!msg.author || msg.author.bot || !msg.channel.guild || !oldMsg) {
        return;
    }

    if (oldMsg.content === msg.content) {
        return;
    }

    const cur = network[msg.channel.id];
    if (!cur) {
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


    const messages = channelsCache[msg.channel.id].get(msg.id);
    for (const [i, message] of messages.entries()) {
        const channelConfig = network[message.channel.id];
        messages[i] = await triggerWHEdit(botClient, network, channelConfig, cur, msg.author, msg.member, fullMsg, message.id);
    }
    setInMap(channelsCache[msg.channel.id], msg.id, messages);
};
