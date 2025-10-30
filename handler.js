// handler.js
import rules from "./rules/index.js"
import commands from "./commands/index.js"
import expressions from "./expressions/index.js"

export const handleMessage = async (sock, msg, lastActivity, saveActivity) => {
  if (!msg.message) return

  const sender = msg.key.participant || msg.key.remoteJid
  const texto =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    ""
  const comando = texto.split(" ")[0].toLowerCase()
  const args = texto.split(" ").slice(1)
  const isGroup = msg.key.remoteJid.endsWith("@g.us")
  const groupId = msg.key.remoteJid

  // 🔹 Guardar actividad (si es grupo)
  if (isGroup) {
    if (!lastActivity[groupId]) lastActivity[groupId] = {}
    if (!lastActivity[groupId][sender])
      lastActivity[groupId][sender] = { ts: 0, name: msg.pushName, msgCount: 0 }

    const userData = lastActivity[groupId][sender]
    userData.ts = msg.messageTimestamp * 1000
    userData.name = msg.pushName
    userData.msgCount++

    // 🔹 Calcular niveles
    const oldLevel = Math.floor((userData.msgCount - 1) / 30) + 1
    const newLevel = Math.floor(userData.msgCount / 30) + 1
    if (newLevel > oldLevel) {
      await sock.sendMessage(groupId, {
        text: `🎉 @${sender.split("@")[0]} ha subido de nivel a *${newLevel}*!`,
        mentions: [sender],
      })
    }
    saveActivity()
  }

  // 🔹 Buscar si es comando o expresión
  const module =
    commands[comando] ||
    expressions[comando] ||
    null
  if (!module) return

  // 🔹 Verificar reglas
  let permitido = true
  for (const regla of rules) {
    if (typeof regla.check === "function") {
      const ok = regla.check(msg)
      if (!ok) {
        permitido = false
        break
      }
    }
  }

  if (!permitido) return

  // 🔹 Ejecutar comando/expresión
  try {
    await module.execute(sock, msg, args, lastActivity, saveActivity)
  } catch (err) {
    console.error(`❌ Error ejecutando ${comando}:`, err)
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Ocurrió un error al ejecutar el comando.",
    })
  }
}