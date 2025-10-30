import comandos from "./commands/index.js"
import rules from "./rules/index.js"
import nivel1 from "./rules/nivel1.js"  // ⬅️ Importamos la regla

export default async function handler(sock, msg, lastActivity, saveActivity) {
  const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
  const sender = msg.key.participant || msg.key.remoteJid
  const isGroup = msg.key.remoteJid.endsWith('@g.us')
  const groupId = msg.key.remoteJid
  const name = msg.pushName || sender

  // ----------------------------
  // 🧠 SISTEMA DE NIVELES (solo grupos registrados)
  // ----------------------------
  if (isGroup && nivel1.check(msg)) {
    if (!lastActivity[groupId]) lastActivity[groupId] = {}
    if (!lastActivity[groupId][sender]) {
      lastActivity[groupId][sender] = { ts: 0, name, msgCount: 0 }
    }

    const userData = lastActivity[groupId][sender]
    userData.ts = msg.messageTimestamp * 1000
    userData.name = name
    userData.msgCount++

    const oldLevel = Math.floor((userData.msgCount - 1) / 30) + 1
    const newLevel = Math.floor(userData.msgCount / 30) + 1

    if (newLevel > oldLevel) {
      await sock.sendMessage(groupId, {
        text: `🎉 @${sender.split('@')[0]} ha subido de nivel a *${newLevel}* :D`,
        mentions: [sender]
      })
    }

    saveActivity()
  }

  // ----------------------------
  // ⚖️ VERIFICACIÓN DE REGLAS (RULES)
  // ----------------------------
  let permitido = true
  for (const rule of rules) {
    const mensajeTexto = texto

    // Permitir el comando !setgrupo sin restricciones
    if (mensajeTexto.startsWith('!setgrupo')) {
      permitido = true
      break
    }

    if (typeof rule.check === 'function') {
      permitido = rule.check(msg)
      if (!permitido) return // Si falla una regla, se detiene
    }
  }

  // ----------------------------
  // 💬 SISTEMA DE COMANDOS
  // ----------------------------
  const comando = texto.split(' ')[0].toLowerCase()
  const args = texto.split(' ').slice(1)

  if (comandos[comando]) {
    const cmd = comandos[comando]

    // ✅ Si el comando tiene reglas asociadas, se revisan individualmente
    if (cmd.rules && Array.isArray(cmd.rules)) {
      for (const rule of cmd.rules) {
        if (typeof rule.check === 'function') {
          const permitido = rule.check(msg)
          if (!permitido) {
            console.log(`❌ Comando ${cmd.name} bloqueado por regla: ${rule.name}`)
            return
          }
        }
      }
    }

    try {
      await cmd.execute(sock, msg, args, lastActivity, saveActivity)
    } catch (err) {
      console.error(`❌ Error ejecutando ${comando}:`, err)
      await sock.sendMessage(groupId, { text: "⚠️ Error ejecutando el comando." })
    }
  }
}