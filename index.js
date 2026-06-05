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
        minecraftBot.setQuickBarSlot(7); // slot 8 = indice 7
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
          
        }, 4000); // Mangia per 4 secondi
        
      }, 300);
      
    }, 300);
    
  }, 600000); // Ogni 10 minuti
}