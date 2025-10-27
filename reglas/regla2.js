// reglas/regla2.js
import fs from "fs"

const gruposFile = './reglas/grupos.json'
let gruposPermitidos = { gruposPermitidos: [] }

if (fs.existsSync(gruposFile)) {
  gruposPermitidos = JSON.parse(fs.readFileSync(gruposFile, 'utf-8'))
}

const saveGrupos = () => {
  fs.writeFileSync(gruposFile, JSON.stringify(gruposPermitidos, null, 2))
}

export default {
  name: "regla2_setGrupo",
  command: '!setgrupo',
  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const isGroup = chatId.endsWith('@g.us')
    if (!isGroup) {
      await sock.sendMessage(chatId, { text: "❌ Solo puedes registrar grupos." })
      return
    }

    const existe = gruposPermitidos.gruposPermitidos.some(g => g.id === chatId)
    if (!existe) {
      gruposPermitidos.gruposPermitidos.push({
        id: chatId,
        nombre: msg.pushName
      })
      saveGrupos()
      await sock.sendMessage(chatId, { text: "✅ Este grupo ha sido registrado correctamente." })
    } else {
      await sock.sendMessage(chatId, { text: "ℹ️ Este grupo ya estaba registrado." })
    }
  }
}
