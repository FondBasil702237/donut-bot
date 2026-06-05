const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// === Sessione ===
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

// === Discord Client (con soli intent necessari) ===
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// === Variabili ===
let minecraftBot = null;
let attackTimeout = null;

// === Funzioni attacco ottimizzate ===
function scheduleAttack() {
  if (!minecraftBot || !minecraftBot.entity) return;
  
  // Tempo random tra 800ms e 1300ms
  const delay = Math.floor(Math.random() * 500) + 800;
  
  attackTimeout = setTimeout(() => {
    if (!minecraftBot || !minecraftBot.entity) return;
    
    const entity = minecraftBot.nearestEntity();
    if (entity) {
      minecraftBot.attack(entity);
    }
    
    // Pianifica il prossimo attacco
    scheduleAttack();
  }, delay);
}

function startAttack() {
  if (!minecraftBot) return false;
  if (attackTimeout) return true;
  
  scheduleAttack();
  console.log('⚔️ Attacco avviato');
  return true;
}

function stopAttack() {
  if (attackTimeout) {
    clearTimeout(attackTimeout);
    attackTimeout = null;
    console.log('🛑 Attacco fermato');
    return true;
  }
  return false;
}

// === Minecraft Bot ===
function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
    minecraftBot = null;
  }
  stopAttack();

  const botOptions = {
    host: 'DonutSMP.net',
    port: 25565,
    username: 'standx72@hotmail.com',
    auth: 'microsoft',
    viewDistance: 'tiny',       // Meno chunk = meno RAM
    checkTimeoutInterval: 60000 // Controlli meno frequenti
  };

  if (sessionData?.accessToken) {
    botOptions.session = {
      accessToken: sessionData.accessToken,
      selectedProfile: sessionData.selectedProfile,
    };
  }

  minecraftBot = mineflayer.createBot(botOptions);

  minecraftBot.once('spawn', () => {
    console.log('✅ Connesso a DonutSMP');
    minecraftBot.setControlState('sneak', true);
    
    // Disabilita funzioni inutili per risparmiare RAM
    if (minecraftBot.pathfinder) minecraftBot.pathfinder.setGoal(null);
    if (minecraftBot.physics) minecraftBot.physics.gravity = 0; // Non serve se fermo
  });

  minecraftBot.on('end', () => {
    console.log('Disconnesso');
    stopAttack();
    minecraftBot = null;
  });

  minecraftBot.on('error', (err) => {
    console.error('Errore MC:', err.message);
    stopAttack();
    minecraftBot = null;
  });
}

function disconnectMinecraftBot() {
  if (minecraftBot) {
    stopAttack();
    minecraftBot.quit();
    minecraftBot = null;
    return true;
  }
  return false;
}

// === Discord ===
discordClient.once('ready', () => {
  console.log('🤖 Bot pronto:', discordClient.user.tag);
});

discordClient.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== '1509219275725082644') return;

  const cmd = message.content.toLowerCase().trim();

  if (cmd === 'on') {
    if (minecraftBot) {
      await message.reply('✅ Già connesso!');
    } else {
      createMinecraftBot();
      await message.reply('🎮 Connesso a DonutSMP!');
    }
  } else if (cmd === 'off') {
    if (disconnectMinecraftBot()) {
      await message.reply('👋 Uscito!');
    } else {
      await message.reply('❌ Non connesso');
    }
  } else if (cmd === 'attack') {
    if (!minecraftBot) {
      await message.reply('❌ Prima connettiti con `on`');
    } else if (attackTimeout) {
      await message.reply('⚔️ Già attivo!');
    } else {
      startAttack();
      await message.reply('⚔️ **ATTACCO!** (0.8-1.3s)');
    }
  } else if (cmd === 'noattack') {
    if (stopAttack()) {
      await message.reply('🛑 **Fermato!**');
    } else {
      await message.reply('❌ Nessun attacco in corso');
    }
  }
});

// === Server HTTP minimo ===
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(process.env.PORT || 3000, () => {
  console.log('💓 Porta', process.env.PORT || 3000);
});

// === Avvio ===
discordClient.login(process.env.DISCORD_TOKEN);

// === Pulizia memoria periodica ===
setInterval(() => {
  if (global.gc) global.gc();
}, 300000); // Ogni 5 minuti