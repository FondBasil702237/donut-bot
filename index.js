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

// === Discord Client ===
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
let antiAfkInterval = null;

// === Funzioni attacco ===
function scheduleAttack() {
  if (!minecraftBot || !minecraftBot.entity) return;
  
  const delay = Math.floor(Math.random() * 500) + 800;
  
  attackTimeout = setTimeout(() => {
    if (!minecraftBot || !minecraftBot.entity) return;
    
    const entity = minecraftBot.nearestEntity();
    if (entity) {
      minecraftBot.attack(entity);
    }
    
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

// === Anti-AFK ogni 10 minuti ===
function startAntiAfk() {
  if (antiAfkInterval) return;
  
  antiAfkInterval = setInterval(() => {
    if (!minecraftBot || !minecraftBot.entity) return;
    
    console.log('🔄 Anti-AFK: movimento + mangia...');
    
    const wasAttacking = !!attackTimeout;
    if (wasAttacking) stopAttack();
    
    // Rilascia sneak
    minecraftBot.setControlState('sneak', false);
    
    // Gira di 180°
    const currentYaw = minecraftBot.entity.yaw;
    const newYaw = (currentYaw + Math.PI) % (Math.PI * 2);
    minecraftBot.look(newYaw, minecraftBot.entity.pitch);
    
    // Cammina avanti 0.3s
    minecraftBot.setControlState('forward', true);
    
    setTimeout(() => {
      if (!minecraftBot) return;
      
      minecraftBot.setControlState('forward', false);
      
      // Rigira di 180°
      minecraftBot.look(currentYaw, minecraftBot.entity.pitch);
      
      // Cammina avanti 0.3s
      minecraftBot.setControlState('forward', true);
      
      setTimeout(() => {
        if (!minecraftBot) return;
        
        minecraftBot.setControlState('forward', false);
        
        // === MANGIA ===
        // Cambia slot 8 (cibo)
        minecraftBot.setQuickBarSlot(7);
        console.log('🍗 Slot 8 selezionato');
        
        // Attiva il cibo (tasto destro)
        minecraftBot.activateItem();
        
        // Tieni premuto per 4 secondi
        setTimeout(() => {
          if (!minecraftBot) return;
          
          // Rilascia il tasto
          minecraftBot.deactivateItem();
          console.log('✅ Mangiato!');
          
          // Torna in sneak
          minecraftBot.setControlState('sneak', true);
          
          // Riprende attacco
          if (wasAttacking) startAttack();
          
          console.log('✅ Anti-AFK completato');
          
        }, 4000);
        
      }, 300);
      
    }, 300);
    
  }, 600000);
}

function stopAntiAfk() {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
  }
}

// === Minecraft Bot ===
function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
    minecraftBot = null;
  }
  stopAttack();
  stopAntiAfk();

  const botOptions = {
    host: 'DonutSMP.net',
    port: 25565,
    username: 'standx72@hotmail.com',
    auth: 'microsoft',
    viewDistance: 'normal',
    checkTimeoutInterval: 60000,
    skipValidation: true
  };

  if (sessionData?.accessToken) {
    console.log('🔑 Uso sessione salvata');
    botOptions.session = {
      accessToken: sessionData.accessToken,
      selectedProfile: sessionData.selectedProfile,
    };
  } else {
    console.log('⚠️ Nessuna sessione, servirà auth manuale');
  }

  minecraftBot = mineflayer.createBot(botOptions);

  minecraftBot.once('spawn', () => {
    console.log('✅ Connesso a DonutSMP');
    minecraftBot.setControlState('sneak', true);
    startAntiAfk();
  });

  minecraftBot.on('end', () => {
    console.log('Disconnesso');
    stopAttack();
    stopAntiAfk();
    minecraftBot = null;
  });

  minecraftBot.on('error', (err) => {
    console.error('Errore MC:', err.message);
    stopAttack();
    stopAntiAfk();
    minecraftBot = null;
  });
}

function disconnectMinecraftBot() {
  if (minecraftBot) {
    stopAttack();
    stopAntiAfk();
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

// === Server HTTP ===
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(process.env.PORT || 3000, () => {
  console.log('💓 Porta', process.env.PORT || 3000);
});

// === Avvio ===
discordClient.login(process.env.DISCORD_TOKEN);

// === Pulizia memoria ===
setInterval(() => {
  if (global.gc) global.gc();
}, 300000);