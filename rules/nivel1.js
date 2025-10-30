import fs from 'fs'

const gruposPath = './rules/grupos.json'

export default {
  name: 'nivel1',
  check: (msg) => {
    const groupId = msg.key.remoteJid
    if (!groupId.endsWith('@g.us')) return true // fuera de grupo, se permite

    // Si no existe el archivo, lo crea vacío
    if (!fs.existsSync(gruposPath)) {
      fs.writeFileSync(gruposPath, JSON.stringify({}, null, 2))
    }

    let grupos = {}
    try {
      const data = fs.readFileSync(gruposPath, 'utf-8').trim()
      grupos = data ? JSON.parse(data) : {}
    } catch (err) {
      console.error('⚠️ Error leyendo grupos.json, regenerando...')
      grupos = {}
      fs.writeFileSync(gruposPath, JSON.stringify({}, null, 2))
    }

    return !!grupos[groupId] // true si el grupo está registrado
  }
}