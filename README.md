# discord-music-bot
Another discord bot written in discord.js + play-dl that plays music from YouTube in voice channel.  

## Usage
*  Create discord application and get bot token and client id
*  Edit the `config.json` file
*  `npm install`
*  `npm start` or `node src/index.js`

### Commands:
**/play <youtube link/text query>** - Join user's voice channel and start playing music  
**/clear** - Clear queue
**/loop** - Loop queue
**/repeat** - Repeat one track
**/skip** - Skip current track
**/pause** - Pause playback  
**/resume** - Resume playback  
**/join** - Join user's voice channel  
**/leave** - Leave current voice channel

## TODO
- [x] Queue for playback  
- [x] Repeat command
- [x] Loop queue command
- [x] Skip command