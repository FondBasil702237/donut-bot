// === Variabili ===
let minecraftBot = null;
let attackTimeout = null;
let antiAfkInterval = null;

// === Funzioni attacco ===
function scheduleAttack() {
  if (!minecraftBot || !minecraftBot.entity) return;
  
  const delay = Math.floor(Math.random() * 500) + 800; // 0.8-1.3s
  
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
    
    console.log('🔄 Anti-AFK: movimento...');
    
    // Salva lo stato attuale
    const wasAttacking = !!attackTimeout;
    if (wasAttacking) stopAttack();
    
    // Rilascia sneak momentaneamente
    minecraftBot.setControlState('sneak', false);
    
    // Gira di 180°
    const currentYaw = minecraftBot.entity.yaw;
    const newYaw = (currentYaw + Math.PI) % (Math.PI * 2);
    minecraftBot.look(newYaw, minecraftBot.entity.pitch);
    
    // Cammina avanti per 0.3 secondi
    minecraftBot.setControlState('forward', true);
    
    setTimeout(() => {
      if (!minecraftBot) return;
      
      // Ferma camminata
      minecraftBot.setControlState('forward', false);
      
      // Rigira di 180°
      minecraftBot.look(currentYaw, minecraftBot.entity.pitch);
      
      // Cammina avanti per 0.3 secondi (torna alla posizione)
      minecraftBot.setControlState('forward', true);
      
      setTimeout(() => {
        if (!minecraftBot) return;
        
        // Ferma tutto
        minecraftBot.setControlState('forward', false);
        minecraftBot.setControlState('sneak', true);
        
        // Riprende attacco
        if (wasAttacking) startAttack();
        
        console.log('✅ Anti-AFK completato');
      }, 300);
      
    }, 300);
    
  }, 600000); // 10 minuti = 600000ms
}

function stopAntiAfk() {
  if (antiAfkInterval) {
    clearInterval(antiAfkInterval);
    antiAfkInterval = null;
  }
}