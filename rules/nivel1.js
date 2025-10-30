// rules/nivel1.js
import fs from 'fs'

const gruposPath = './rules/grupos.json'

export default {
  name: 'nivel1',
  check: (msg) => {
    const groupId = msg.key.remoteJid
    if (!groupId.endsWith('@g.us')) return true // fuera de grupo, se permite
    if (!fs.existsSync(gruposPath)) return false

    const grupos = JSON.parse(fs.readFileSync(gruposPath, 'utf-8'))
    return !!grupos[groupId] // true si el grupo está registrado
  }
}