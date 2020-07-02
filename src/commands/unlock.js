'use strict';

const SEND_PERM = 2048;

async function unlock(bot, channel, roleID) {
    try {
        const perms = channel.permissionOverwrites.get(roleID);
        await bot.editChannelPermission(channel.id, roleID, perms.allow, perms.deny & ~SEND_PERM);

        bot.createMessage(channel.id, 'Channel locked!').catch();
    } catch (err) {
        bot.createMessage(channel.id, 'Permission Error').catch();

        console.log(`Permission error in ${channel.guild.name}`);
    }
}

module.exports = async(botClient, network, channelsCache, msg, args) => {
    if (args[0] === 'all') {
        for (const channelID in network) {
            const channelConfig = network[channelID];
            const channel = botClient.guilds.get(channelConfig.guildID).channels.get(channelConfig.channelID);
            await unlock(botClient, channel, channelConfig.guildID);
        }
    } else {
        unlock(botClient, msg.channel, msg.channel.guild.id);
    }
};

