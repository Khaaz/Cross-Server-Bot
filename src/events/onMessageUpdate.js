'use strict';

const { deconstructMention } = require('../enhancedMention');
const { triggerWH, setInMap, MESSAGE_LIMIT } = require('../utils');

exports.onMessageUpdate = async(botClient, network, channelsCache, deleteOnUpdate, msg, oldMsg) => {
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

    msg.content += ' *(edited)*';

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
        messages.push(await triggerWH(botClient, network, channelConfig, cur, msg.author, fullMsg) );
    }
    if (deleteOnUpdate) {
        const toDelete = channelsCache[msg.channel.id].get(msg.id);
        for (const m of toDelete) {
            m.delete().catch();
        }
    }
    setInMap(channelsCache[msg.channel.id], msg.id, messages);
};
