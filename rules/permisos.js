// rules/permisos.js
import fs from 'fs'
import { tipoChat } from './tipoChat.js'

const permisosPath = './rules/permisos.json'

// Asegura que exista el archivo
if (!fs.existsSync(permisosPath)) fs.writeFileSync(permisosPath, '{}')

export const permisos = {
  obtener() {
    return JSON.parse(fs.readFileSync(permisosPath, 'utf-8'))
  },

  guardar(data) {
    fs.writeFileSync(permisosPath, JSON.stringify(data, null, 2))
  },

  tienePermiso(msg) {
    const tipo = tipoChat(msg)
    const id = msg.key.remoteJid
    const data = this.obtener()

    // Si es privado y está habilitado
    if (tipo === 'privado' && data.privados?.includes(id)) return true

    // Si es grupo y está registrado
    if (tipo === 'grupo' && data.grupos?.includes(id)) return true

    // Si pertenece a una comunidad configurada
    if (tipo === 'comunidad' && data.comunidad?.id === id) return true

    return false
  }
}