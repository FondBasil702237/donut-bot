#Requires AutoHotkey v2.0

; Tieni premuto SHIFT DESTRO per attivare/disattivare
RShift::
{
    static toggle := false
    toggle := !toggle
    
    if (toggle) {
        SendInput("{LShift down}")  ; Abbassa lo shift
        SetTimer(Attack, 1000)      ; Attacca ogni 1000ms (1 secondo)
        ToolTip("AFK ATTACK ON")
    } else {
        SetTimer(Attack, 0)         ; Ferma l'attacco
        SendInput("{LShift up}")    ; Rilascia lo shift
        ToolTip("AFK ATTACK OFF")
        SetTimer(() => ToolTip(), -2000)  ; Nasconde il tooltip dopo 2s
    }
}

Attack() {
    SendInput("{LButton down}")
    Sleep(50)
    SendInput("{LButton up}")
}