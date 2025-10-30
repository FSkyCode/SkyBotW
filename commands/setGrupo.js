import fs from 'fs'
import path from 'path'
import nivel2 from '../rules/nivel2.js'  // ⬅️ Importas la regla que quieras

const gruposPath = path.resolve('./rules/grupos.json')

export default {
  name: '!setGrupo',
  description: 'Agrega este grupo como autorizado para usar el bot.',
  rules: [nivel2], // ✅ puedes agregar aquí las reglas que este comando requiere

  execute: async (sock, msg) => {
    const remoteJid = msg.key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')

    if (!isGroup) {
      await sock.sendMessage(remoteJid, {
        text: "--SKY BOT RESPONDIENDO-- ❌ Este comando solo puede usarse dentro de un grupo."
      })
      return
    }

    if (!fs.existsSync(gruposPath)) {
      fs.writeFileSync(gruposPath, JSON.stringify({}, null, 2))
    }

    const grupos = JSON.parse(fs.readFileSync(gruposPath, 'utf-8'))
    const groupId = remoteJid
    const groupName = msg.pushName || "Grupo"

    if (grupos[groupId]) {
      await sock.sendMessage(groupId, {
        text: `⚠️ Este grupo ya está registrado.`
      })
      return
    }

    grupos[groupId] = {
      nombre: groupName,
      agregado: new Date().toISOString()
    }

    fs.writeFileSync(gruposPath, JSON.stringify(grupos, null, 2))

    await sock.sendMessage(groupId, {
      text: `✅ Este grupo ha sido agregado a la lista de grupos autorizados.\n🆔 ID: ${groupId}`
    })
  }
}