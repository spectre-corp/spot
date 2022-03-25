const winston = require('winston');
const { Client, Intents } = require('discord.js');
const { token } = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const findRemoveSync = require('find-remove');
const { exec } = require('child_process');
var crypto = require("crypto");

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'spoutnik.log' }),
	],
});

logger.add(new winston.transports.Console({
	format: winston.format.simple(),
}));

client.once('ready', () => {
	logger.info('🚀 Spoutnik is online !');
	logger.info('🤙 Invite the bot ! https://discord.com/api/oauth2/authorize?client_id=956132132563091466&permissions=8&scope=bot%20applications.commands')
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
	if (commandName === 'ping') {
		logger.info('Asked for a ping command')
		await interaction.reply('Pong!');
	} else if (commandName === 'spoutdl') {
		logger.info('Asked for the spoutdl command')
		var id = crypto.randomBytes(20).toString('hex');
		logger.info('Generated ID : ' + id)
		await spoutdl(interaction, id);
	} else if (commandName == 'setup') {
		logger.info('Asked for the setup command')
	}
});

async function spoutdl(interaction, id) {
	url = interaction.options.getString("url")
	logger.info(` [${id}] Asking for parsing on URL : ${url}`)

	if (url.includes("https://www.youtube.com")) {
		logger.info(` [${id}] URL is a valid YouTube URL`)
		interaction.reply(`Downloading your music with id [${id}]`)
		dl_ytb(interaction, id)
	}

	else{
		logger.error(` [${id}] URL is not a valid YouTube URL`)
		interaction.reply("😥 I'm sorry but this URL is not valid.")
	}
}

async function dl_ytb(interaction, id) {
	logger.info(` [${id}] Calling yt-dlp`)
	exec('./yt-dlp -x -P /tmp/down/' + id + ' ' + interaction.options.getString('url'), (error, stdout, stderr) => {
		if (error) {
		  logger.error(` [${id}] exec error: ${error}`);
		  interaction.followUp(`❌ ${stderr}`);
		  return;
		}
		else{
			zip(interaction, id);
			logger.info(` [${id}] Download complete`)
		}
		logger.info(` [${id}] ${stdout}`);
		if(stderr != ""){
			logger.error(` [${id}] ${stderr}`);
		}

	  });
}

async function zip(interaction, id){
	exec(`zip -r -j /tmp/zipped/${id}.zip /tmp/down/${id}/*`, (error, stdout, stderr) => {
		if (error) {
		  logger.error(` [${id}] ${error}`);
		  interaction.followUp(`❌ ${stderr}`);
		  return;
		}
		else{
			logger.info(` [${id}] ZIP complete`)
			sendZipLink(interaction, id);
		}
		logger.info(` [${id}] ${stdout}`);
		if(stderr != ""){
			logger.error(` [${id}] ${stderr}`);
		}

	  });
	cleanupDownloads();
}

async function sendZipLink(interaction, id){
	interaction.user.send(`Your music is available : ${process.env.WEBHOST}${id}.zip`)
}

async function cleanupDownloads(){
	logger.info('🧹 Cleaning up leftover downloads...')
	findRemoveSync('/tmp/down', {age: {hours: 24}})
	findRemoveSync('/tmp/zipped', {age: {hours: 24}})
}

setInterval(cleanupDownloads, 1000 * 60 * 60);

cleanupDownloads();
client.login(token);