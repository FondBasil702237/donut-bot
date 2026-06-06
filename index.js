const { Client, GatewayIntentBits } = require('discord.js');
const mineflayer = require('mineflayer');
const http = require('http');

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

  // Ogni secondo: attacca il mob più vicino
  const swingInterval = setInterval(() => {
    if (!minecraftBot) return;
    
    const entity = minecraftBot.nearestEntity((e) => e.type === 'mob');
    if (entity) {
      minecraftBot.attack(entity);
    } else {
      minecraftBot.swingArm('left');
    }
  }, 1000);

  // Ogni 10 minuti: movimento + tasto 8 + RMB 4s + tasto 1
  const moveInterval = setInterval(() => {
    if (!minecraftBot) return;
    minecraftBot.setControlState('sneak', false);
    const yaw = minecraftBot.entity.yaw;
    minecraftBot.look((yaw + Math.PI) % (Math.PI * 2), 0);
    minecraftBot.setControlState('forward', true);
    setTimeout(() => {
      if (!minecraftBot) return;
      minecraftBot.setControlState('forward', false);
      const yaw2 = minecraftBot.entity.yaw;
      minecraftBot.look((yaw2 + Math.PI) % (Math.PI * 2), 0);
      minecraftBot.setControlState('forward', true);
      setTimeout(() => {
        if (!minecraftBot) return;
        minecraftBot.setControlState('forward', false);
        minecraftBot.setQuickBarSlot(7);
        minecraftBot.activateItem(true);
        setTimeout(() => {
          if (!minecraftBot) return;
          minecraftBot.activateItem(false);
          minecraftBot.setQuickBarSlot(0);
          minecraftBot.setControlState('sneak', true);
        }, 4000);
      }, 200);
    }, 200);
  }, 10 * 60 * 1000);

  antiAfkInterval = { swingInterval, moveInterval };
}

function stopAntiAfk() {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval.swingInterval);
    clearInterval(antiAfkInterval.moveInterval);
    antiAfkInterval = null;
  }
}

function createMinecraftBot() {
  if (minecraftBot) {
    minecraftBot.quit();
    minecraftBot = null;
  }
  stopAntiAfk();

  const accessToken = process.env.MINECRAFT_TOKEN;
  if (!accessToken) {
    console.error('❌ MINECRAFT_TOKEN non impostato!');
    return;
  }

  minecraftBot = mineflayer.createBot({
    host: 'DonutSMP.net',
    port: 25565,
    username: 'standx72@hotmail.com',
    auth: 'microsoft',
    session: {
      accessToken: accessToken,
      selectedProfile: {
        id: '5ecfad6adfb141d5b47499ece11d18be',
        name: 'FondBasil702237'
      }
    }
  });

  minecraftBot.once('spawn', () => {
    console.log('✅ Connesso a DonutSMP!');
    minecraftBot.setControlState('sneak', true);
    startAntiAfk();
  });

  minecraftBot.on('end', () => {
    console.log('Disconnesso');
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
      await message.reply('🎮 Connesso a DonutSMP!');
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