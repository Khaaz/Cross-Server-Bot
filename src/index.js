'use strict';

const { onMessageCreate } = require('./events/onMessageCreate');
const { onMessageUpdate } = require('./events/onMessageUpdate');
const { onMessageDelete } = require('./events/onMessageDelete');

exports.setup = function (bot, config) {
    const network = {};
    const channelsCache = {};

    bot.prefix = config.prefix;

    bot.once('ready', () => {
        console.log('Ready!');

        for (const val of config.guilds) {
            const botGuild = bot.guilds.get(val.guildID);
            if (!botGuild) {
                console.log(`Bot not in the guild: ${val.name}(${val.guildID})`);
            } else {
                network[val.channelID] = val;
                channelsCache[val.channelID] = new Map();
                
                bot.executeWebhook(val.whID, val.whToken, {
                    username: bot.user.username,
                    avatarURL: bot.user.avatarURL,
                    content: 'Bot Ready - Cross Server system operational!',
                } );
            }
        }
    } );

    bot.on('messageCreate', (msg) => onMessageCreate(bot, network, channelsCache, msg) );
    bot.on('messageUpdate', (msg, oldMsg) => onMessageUpdate(bot, network, channelsCache, config.deleteOnUpdate, msg, oldMsg) );
    
    if (config.messageDelete) {
        bot.on('messageDelete', (msg) => onMessageDelete(bot, network, channelsCache, msg) );
    }
};
