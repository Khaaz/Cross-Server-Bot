'use strict';

const config = require('./config.json');
const { bot } = require('./src/bot');
const { setup } = require('./src/index');

setup(bot, config);

bot.connect();
