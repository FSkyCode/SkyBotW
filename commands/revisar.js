import { formatInactivity } from "../utils.js"

export default {
  name: '!revisar',
  description: 'Muestra inactividad y nivel de los miembros del grupo.',
  
  execute: async (sock, msg, args, lastActivity) => {
    const isGroup = msg.key.remoteJid.endsWith('@g.us')
    const groupId = msg.key.remoteJid

    if (!isGroup) {
      await sock.sendMessage(groupId, { text: "❌ Este comando solo funciona en grupos." })
      return
    }

    const groupData = lastActivity[groupId] || {}

    if (Object.keys(groupData).length === 0) {
      await sock.sendMessage(groupId, { text: "📭 No hay actividad registrada aún." })
      return
    }

    let response = "📊 *Actividad y niveles de miembros:*\n\n"

    for (const [user, data] of Object.entries(groupData)) {
      const name = data.name || user.split('@')[0]
      const level = Math.floor(data.msgCount / 30) + 1
      const inactivity = formatInactivity(data.ts)

      response += `👤 *${name}*\n🕓 Último mensaje hace ${inactivity}\n🏆 Nivel: ${level}\n\n`
    }

    await sock.sendMessage(groupId, { text: response })
  }
}
