const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    Collection,
    Events,
    GatewayIntentBits
} = require('discord.js');
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const {
    TOKEN,
    HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = require('./config.json');

(async () => {
    const dbConnection = await mysql.createConnection({
        host     : HOST,
        user     : DB_USER,
        password : DB_PASSWORD,
        database : DB_NAME,
        Promise: bluebird
    });
    await dbConnection.execute(
        "CREATE TABLE IF NOT EXISTS playing (guild_id TEXT, queue_id INT, song TEXT)"
    );
    await dbConnection.execute(
        "CREATE TABLE IF NOT EXISTS queue (guild_id TEXT, queue_id INT, song TEXT)"
    );
    await dbConnection.execute(
        "CREATE TABLE IF NOT EXISTS settings (guild_id TEXT, loop_queue TINYINT, repeat_track TINYINT)"
    );
    await dbConnection.close();
})();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => {
            try {
                event.execute(...args);
            } catch (error) {
                console.error('An error during event occured:', error);
            }
        });
    }
}

client.on(Events.ShardError, error => {
    console.error('A websocket connection encountered an error:', error);
});

client.login(TOKEN);
