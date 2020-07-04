'use strict';

const config = require('./config.json');
const { bot } = require('./src/bot');
const { setup } = require('./src/index');

function formatDate() {
    const date = new Date();

    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} - ${date.getHours()}:${date.getMinutes()}`;
}

setup(bot, config);

bot.connect();

bot.on('error', (err) => console.log(`${formatDate()} : ${err.stack || err.message}`) );
bot.on('warn', (msg) => console.log(`${formatDate()} : ${msg}`) );
