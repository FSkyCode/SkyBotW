
import reglas from "../rules/index.js"

export default {
  name: '!setGrupo',
  description: 'Agrega este grupo como autorizado para usar el bot.',
  execute: async (sock, msg) => {
    const isGroup = msg.key.remoteJid.endsWith('@g.us')
    if (!isGroup) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "--SKY BOT RESPONDIENDO-- ❌ Este comando solo puede usarse dentro de un grupo."
      })
      return
    }

    const groupId = msg.key.remoteJid
    const groupName = msg.pushName || "Grupo"

    const regla1 = reglas.find(r => r.name === "regla1_grupos")
    regla1.setGrupo(groupId, {
      nombre: groupName,
      agregado: new Date().toISOString()
    })

    await sock.sendMessage(groupId, {
      text: `✅ Este grupo ha sido agregado a la lista de grupos autorizados.\n🆔 ID: ${groupId}`
    })
  }
}
