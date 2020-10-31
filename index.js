'use strict';

const config = require('./config.json');
const { bot } = require('./src/bot');
const { setup } = require('./src/index');

setup(bot, config);

bot.connect();

// bot.on('error', (err) => console.log(err);
// bot.on('warn', (msg) => console.log(msg);
