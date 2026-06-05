const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');
const path = require('path');

let sessionData = null;
try {
  const sessionPath = path.join(__dirname, 'session.json');
  if (fs.existsSync(sessionPath)) {
    sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    console.log('✅ Sessione caricata');
  }
} catch (err) {
  console.error('❌ Errore sessione:', err.message);
}

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let minecraftBot = null;
let attackInterval = null;  // <-- NUOVO: intervallo attacco

function startAttack() {
  if (!minecraftBot) return false;
  if (attackInterval) return true; // già attivo
  
  attackInterval = setInterval(() => {
    if (minecraftBot && minecraftBot.entity) {
      // Attacca l'entità più vicina (o il vuoto)
      const entity = minecraftBot.nearestEntity();
      if (entity) {
        minecraftBot.attack(entity);
      }
    }
  }, 1000);
  
  console.log('⚔️ Attacco automatico avviato!');
  return true;
}

function stopAttack() {
  if (attackInterval) {
    clearInterval(attackInterval);
    attackInterval = null;
    console.log('🛑 Attacco fermato!');
    return true;
  }
  return false;
}

function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
    minecraftBot = null;
  }

  // Ferma eventuale attacco precedente
  stopAttack();

  const botOptions = {
    host: 'DonutSMP.net',
    port: 25565,
    username: 'standx72@hotmail.com',
    auth: 'microsoft',
  };

  if (sessionData && sessionData.accessToken) {
    botOptions.session = {
      accessToken: sessionData.accessToken,
      selectedProfile: sessionData.selectedProfile,
    };
  }

  minecraftBot = mineflayer.createBot(botOptions);

  minecraftBot.once('spawn', () => {
    console.log('✅ Connesso a DonutSMP!');
    minecraftBot.setControlState('sneak', true);
  });

  minecraftBot.on('end', () => {
    console.log('Disconnesso da Minecraft');
    stopAttack();  // <-- NUOVO: ferma attacco quando esce
    minecraftBot = null;
  });

  minecraftBot.on('error', (err) => {
    console.error('Errore MC:', err.message);
    stopAttack();  // <-- NUOVO
    minecraftBot = null;
  });
}

function disconnectMinecraftBot() {
  if (minecraftBot) {
    stopAttack();  // <-- NUOVO: ferma attacco prima di uscire
    minecraftBot.quit();
    minecraftBot = null;
    return true;
  }
  return false;
}

discordClient.once('ready', () => {
  console.log('🤖 Bot pronto:', discordClient.user.tag);
});

discordClient.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== '1509219275725082644') return;

  const cmd = message.content.toLowerCase().trim();

  // ============ ON ============
  if (cmd === 'on') {
    if (minecraftBot) {
      await message.reply('✅ Già connesso!');
    } else {
      createMinecraftBot();
      await message.reply('🎮 Connesso a DonutSMP!');
    }
  }
  
  // ============ OFF ============
  else if (cmd === 'off') {
    if (disconnectMinecraftBot()) {
      await message.reply('👋 Uscito!');
    } else {
      await message.reply('❌ Non connesso');
    }
  }
  
  // ============ ATTACK ============
  else if (cmd === 'attack') {
    if (!minecraftBot) {
      await message.reply('❌ Devi prima connetterti con `on`!');
    } else if (attackInterval) {
      await message.reply('⚔️ Attacco già attivo!');
    } else {
      startAttack();
      await message.reply('⚔️ **ATTACCO ATTIVATO!** Attacca ogni secondo.');
    }
  }
  
  // ============ NOATTACK ============
  else if (cmd === 'noattack') {
    if (stopAttack()) {
      await message.reply('🛑 **Attacco fermato!**');
    } else {
      await message.reply('❌ Nessun attacco in corso.');
    }
  }
});

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, () => {
  console.log('💓 Porta', PORT);
});

discordClient.login(process.env.DISCORD_TOKEN);