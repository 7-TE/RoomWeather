const fetch = require('node-fetch');
const chalk = require('chalk');
const { Client } = require('discord-rpc');
const client = new Client({
    transport: 'ipc'
});

const config = require('./config.json');

const SUCCESS = chalk.hex('#43B581');
const ERROR = chalk.hex('#F04747');
const INFO = chalk.hex('#FF73FA');
const LOG = chalk.hex('#44DDBF');

/* Adds [LOG] and [dd/mm/yyyy | hh:mm:ss UTC] prefix to all console.log's */

let originalConsoleLog = console.log;
console.log = function () {
    args = [];
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    args.push(`${LOG(`[LOG]`)} ${INFO(`[${day}/${month}/${year} | ${hours}:${minutes}:${seconds} UTC]`)}`);
    for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    originalConsoleLog.apply(console, args);
}

/* Adds [ERROR] and [dd/mm/yyyy | hh:mm:ss UTC] prefix to all console.error's */

let originalConsoleError = console.error;
console.error = function () {
    args = [];
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    args.push(`${ERROR(`[ERROR]`)} ${INFO(`[${day}/${month}/${year} | ${hours}:${minutes}:${seconds} UTC]`)}`);
    for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    originalConsoleError.apply(console, args);
}

console.log(INFO('Attempting to connect, please wait... (if it fails, "CTRL+R" in Discord and try again)'));

let protocol = new RegExp('^(http|https)://');
let rpc = config.rich_presence;

/* Consecutively execute initialTasks before updating the user's profile (onStartup only) */

function onStartup() {
    validateConfig();

    // wait 5 seconds
    setTimeout(updatePresence, 5 * 1000);
    // periodically update presence
    setInterval(updatePresence, config.updateInterval * 1000)
}

/* Ensure the user's config meets all the requirements */

function validateConfig() {
    console.log(INFO(`Validating configuration...`));
    if (!protocol.test(config.apiBaseURL.toString())) {
        return console.error(ERROR(`apiBaseURL provided does not contain either "http://" OR "https://".`));
    }
    if (config.updateInterval <= 0) {
        return console.error(ERROR(`updateInterval provided is not greater than 0`));
    }
    if (rpc.details && rpc.details.length > 128) {
        return console.error(ERROR(`Details provided exceeds the maximum character length of 128.`));
    } else if (rpc.details && rpc.details.length < 2) {
        return console.error(ERROR(`Details provided does not meet the minimum character length of 2.`));
    }
    if (rpc.state && rpc.state.length > 128) {
        return console.error(ERROR(`State provided exceeds the maximum character length of 128.`));
    } else if (rpc.state && rpc.state.length < 2) {
        return console.error(ERROR(`State provided does not meet the minimum character length of 2.`));
    }
    if (!rpc.button.buttonLabelText) {
        return console.error(ERROR(`ButtonLabelText(s) provided does not meet the minimum character length of 1.`));
    } else if (rpc.button.buttonLabelText.length > 128) {
        return console.error(ERROR(`ButtonLabelText(s) provided exceeds the maximum character length of 128.`));
    }
    if (!protocol.test(rpc.button.buttonRedirectUrl.toString())) {
        return console.error(ERROR(`ButtonRedirectUrl(s) provided does not contain either "http://" OR "https://".`));
    }
    console.log(SUCCESS(`Configuration is valid! Attempting to update ${client.user.username}#${client.user.discriminator}'s Rich Presence...`));
}

async function fetchApiData() {
    let reqTemperature = await fetch(config.apiBaseURL.toString() + "/temperature");
    let reqHumidity = await fetch(config.apiBaseURL.toString() + "/humidity");

    //TODO: handle errors

    let result = {};

    result.temperature = reqTemperature.ok ? await reqTemperature.text() : "N/A";
    result.humidity = reqHumidity.ok ? await reqHumidity.text() : "N/A";

    console.log(result);
    return result;
}

/* Update user's Rich Presence */

async function updatePresence() {
    const data = await fetchApiData();

    console.log(INFO(`Successfully updated ${client.user.username}#${client.user.discriminator}'s Rich Presence!`));
    return client.request('SET_ACTIVITY', {
        pid: process.pid,
        activity: {
            details: `${rpc.temperature}: ${data.temperature} °C`,
            state: `${rpc.humidity}: ${data.humidity} %`,
            buttons: [{
                    label: rpc.button.buttonLabelText,
                    url: rpc.button.buttonRedirectUrl
                }
            ],
            timestamps: {
                start: new Date().getTime(),
                end: new Date().getTime() + config.updateInterval * 1000
            },
            instance: true
        }
    });
}

/* Once the client is ready, call onStartup() to execute initialTasks */

client.on('ready', async () => {
    console.log(SUCCESS(`Successfully authorised as ${client.user.username}#${client.user.discriminator}`));
    try {
        onStartup();
    } catch (err) {
        console.error(ERROR(err));
    }
});

/* Login using the user's Discord Developer Application ID */

client.login({ clientId: config.clientId }).catch(ERROR(console.error));