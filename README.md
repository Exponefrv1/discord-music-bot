# discord-music-bot
Another discord bot written in discord.js + play-dl that plays music from YouTube in voice channel.  
There is no queue and songs loop for now.

## Usage
*  Create discord application and get bot token and client id
*  Edit the `config.json` file
*  `npm install`
*  `npm start` or `node src/index.js`

### Commands:
**/play <youtube link/text query>** - Join user's voice channel and start playing music  
**/pause** - Pause playback  
**/resume** - Resume playback  
**/join** - Join user's voice channel  
**/leave** - Leave current voice channel

## TODO
[x] Make a queue for playback  
[x] Make a repeat command
