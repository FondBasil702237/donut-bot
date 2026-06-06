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
let antiAfkInterval = null;

function startAntiAfk() {
  if (!minecraftBot) return;

  // Ogni secondo: colpisce (LMB - sinistro)
  const swingInterval = setInterval(() => {
    if (minecraftBot) {
      minecraftBot.swingArm('left');
    }
  }, 1000);

  // Ogni 10 minuti: movimento + tasto 8 + RMB 4s + tasto 1 + shift + LMB
  const moveInterval = setInterval(() => {
    if (!minecraftBot) return;

    // Smetti di shiftare per muoverti
    minecraftBot.setControlState('sneak', false);

    // Guarda indietro (180 gradi)
    const yaw = minecraftBot.entity.yaw;
    const newYaw = (yaw + Math.PI) % (Math.PI * 2);
    minecraftBot.look(newYaw, 0);

    // Cammina avanti per 0.2 secondi
    minecraftBot.setControlState('forward', true);
    setTimeout(() => {
      if (!minecraftBot) return;
      minecraftBot.setControlState('forward', false);

      // Girati di nuovo (180 gradi)
      const yaw2 = minecraftBot.entity.yaw;
      const newYaw2 = (yaw2 + Math.PI) % (Math.PI * 2);
      minecraftBot.look(newYaw2, 0);

      // Cammina avanti per 0.2 secondi
      minecraftBot.setControlState('forward', true);
      setTimeout(() => {
        if (!minecraftBot) return;
        minecraftBot.setControlState('forward', false);

        // Schiaccia tasto 8 (slot 8)
        minecraftBot.setQuickBarSlot(7);

        // Tieni premuto RMB per 4 secondi
        minecraftBot.activateItem(true);
        setTimeout(() => {
          if (!minecraftBot) return;
          minecraftBot.activateItem(false);

          // Torna allo slot 1
          minecraftBot.setQuickBarSlot(0);

          // Torna shiftato
          minecraftBot.setControlState('sneak', true);
          console.log('🔄 Ciclo anti-AFK completato');
        }, 4000);
      }, 200);
    }, 200);
  }, 10 * 60 * 1000); // 10 minuti

  antiAfkInterval = { swingInterval, moveInterval };
  console.log('🔄 Anti-AFK avviato');
}

function stopAntiAfk() {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval.swingInterval);
    clearInterval(antiAfkInterval.moveInterval);
    antiAfkInterval = null;
    console.log('⏹️ Anti-AFK fermato');
  }
}

function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
    minecraftBot = null;
  }
  stopAntiAfk();

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
    startAntiAfk();
  });

  minecraftBot.on('end', () => {
    console.log('Disconnesso da Minecraft');
    stopAntiAfk();
    minecraftBot = null;
  });

  minecraftBot.on('error', (err) => {
    console.error('Errore MC:', err.message);
    stopAntiAfk();
    minecraftBot = null;
  });
}

function disconnectMinecraftBot() {
  stopAntiAfk();
  if (minecraftBot) {
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

  if (cmd === 'on') {
    if (minecraftBot) {
      await message.reply('✅ Già connesso!');
    } else {
      createMinecraftBot();
      await message.reply('🎮 Connesso a DonutSMP! AFK attivo.');
    }
  } else if (cmd === 'off') {
    if (disconnectMinecraftBot()) {
      await message.reply('👋 Uscito!');
    } else {
      await message.reply('❌ Non connesso');
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