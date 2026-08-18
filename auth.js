// auth.js – Script per ottenere il token Microsoft
const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, 'minecraft-cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const bot = mineflayer.createBot({
  host: 'DonutSMP.net',
  port: 25565,
  username: 'tinder.pp2sx0vl@outlook.com',
  auth: 'microsoft',
  cache: cacheDir
});

bot.once('login', () => {
  console.log('✅ Autenticazione completata!');
  
  setTimeout(() => {
    if (bot._client && bot._client.session) {
      const s = bot._client.session;
      const sessionData = {
        accessToken: s.accessToken,
        refreshToken: s.refreshToken || null,
        expiresAt: s.expiresAt,
        selectedProfile: s.selectedProfile,
        tokenType: s.tokenType
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'session.json'),
        JSON.stringify(sessionData, null, 2)
      );
      console.log('💾 session.json salvato!');
      console.log('📋 Copia il valore di "accessToken" e usalo su Render come MINECRAFT_TOKEN');
    }
    
    bot.quit();
    process.exit(0);
  }, 2000);
});

bot.on('error', (err) => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
