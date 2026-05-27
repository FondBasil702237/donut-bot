// auth.js
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
  username: 'standx72@hotmail.com',
  auth: 'microsoft',
  cache: cacheDir
});

bot.once('login', () => {
  console.log('✅ Autenticazione completata!');
  
  setTimeout(() => {
    // Salva la sessione
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
    }
    
    // Mostra i file nella cache
    const files = fs.readdirSync(cacheDir);
    console.log('📁 File nella cache:', files);
    files.forEach(f => {
      const content = fs.readFileSync(path.join(cacheDir, f), 'utf8');
      console.log(`\n--- ${f} ---`);
      console.log(content.substring(0, 300));
    });
    
    bot.quit();
    process.exit(0);
  }, 2000);
});

bot.on('error', (err) => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});