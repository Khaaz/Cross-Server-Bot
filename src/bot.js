'use strict';

const { Client } = require('eris');
const config = require('../config.json');

exports.bot = new Client(config.token, {
    defaultImageFormat: 'png',
    defaultImageSize: 1024,
    autoreconnect: true,
    messageLimit: 1000,
    getAllUsers: true,
    intents: [
        "guilds",
        "guildMessages",
        "guildMembers",
    ],
} );

