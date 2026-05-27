const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// === Carica la sessione dal file ===
let sessionData = null;
try {
  const sessionPath = path.join(__dirname, 'session.json');
  if (fs.existsSync(sessionPath)) {
    sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    console.log('✅ Sessione caricata da session.json');
  } else {
    console.log('⚠️  session.json non trovato');
  }
} catch (err) {
  console.error('❌ Errore caricamento sessione:', err.message);
}

// === Discord ===
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

let minecraftBot = null;

function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
  }

  const botOptions = {
    host: process.env.MINECRAFT_HOST || 'DonutSMP.net',
    port: parseInt(process.env.MINECRAFT_PORT) || 25565,
    username: process.env.MINECRAFT_EMAIL || 'standx72@hotmail.com',
    auth: 'microsoft',
  };

  // Se abbiamo una sessione salvata, usala
  if (sessionData && sessionData.accessToken) {
    botOptions.session = {
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt,
      selectedProfile: sessionData.selectedProfile,
      tokenType: sessionData.tokenType
    };
    console.log('🔑 Uso sessione salvata');
  }

  minecraftBot = mineflayer.createBot(botOptions);

  minecraftBot.once('spawn', () => {
    console.log(`✅ Connesso a ${botOptions.host}`);
    minecraftBot.setControlState('sneak', true);
    console.log('👤 Accovacciato');
  });

  minecraftBot.on('end', (reason) => {
    console.log(`Disconnesso: ${reason}`);
    minecraftBot = null;
  });

  minecraftBot.on('error', (err) => {
    console.error('Errore MC:', err.message);
    minecraftBot = null;
  });
}

// === Comandi Discord ===
discordClient.once('ready', () => {
  console.log(`🤖 Bot Discord: ${discordClient.user.tag}`);
});

discordClient.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.type !== 1) return;
  const cmd = message.content.toLowerCase().trim();

  if (cmd === 'on') {
    if (minecraftBot) {
      await message.reply('✅ Già connesso!');
    } else {
      createMinecraftBot();
      await message.reply('🎮 Connesso a DonutSMP!');
    }
  } else if (cmd === 'off') {
    if (minecraftBot) {
      minecraftBot.quit();
      await message.reply('👋 Uscito!');
    } else {
      await message.reply('❌ Non connesso');
    }
  }
});

// === Health check ===
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, () => {
  console.log(`💓 Porta ${PORT}`);
});

// === Avvia ===
discordClient.login(process.env.DISCORD_TOKEN);