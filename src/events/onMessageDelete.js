'use strict';

exports.onMessageDelete = async(botClient, network, channelsCache, msg) => {
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

    const messages = channelsCache[msg.channel.id].get(msg.id);
    for (const m of messages) {
        m.delete().catch();
    }
    channelsCache[msg.channel.id].delete(msg.id);
};
