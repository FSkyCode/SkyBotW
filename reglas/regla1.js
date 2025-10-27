
// reglas/regla1.js
import fs from "fs"

const gruposFile = './reglas/grupos.json'

// 🔹 Cargar grupos permitidos
let gruposPermitidos = { gruposPermitidos: [] }

if (fs.existsSync(gruposFile)) {
  try {
    gruposPermitidos = JSON.parse(fs.readFileSync(gruposFile, 'utf-8'))
  } catch (err) {
    console.error("❌ Error leyendo grupos.json:", err)
  }
}

// 🔹 Guardar cambios
const saveGrupos = () => {
  fs.writeFileSync(gruposFile, JSON.stringify(gruposPermitidos, null, 2))
}

// 🔹 Regla: solo responder si el grupo está autorizado
export default {
  name: "regla1_grupos",

  check: (msg) => {
    const chatId = msg.key.remoteJid
    const isGroup = chatId.endsWith('@g.us')

    if (!isGroup) return true
    if (!gruposPermitidos.gruposPermitidos.length) return true

    // Permitir si el grupo está en la lista
    return gruposPermitidos.gruposPermitidos.some(g => g.id === chatId)
  },

  getGrupos: () => gruposPermitidos,

  setGrupo: (groupId, info = {}) => {
    if (!gruposPermitidos.gruposPermitidos.some(g => g.id === groupId)) {
      gruposPermitidos.gruposPermitidos.push({
        id: groupId,
        ...info
      })
      saveGrupos()
    }
  }
}
