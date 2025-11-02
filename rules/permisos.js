// rules/permisos.js
import fs from "fs"

const permisosPath = "./rules/permisos.json"

/**
 * Inicializa o lee el archivo de permisos.
 */
function loadPermisos() {
  // Crear carpeta si no existe
  if (!fs.existsSync("./rules")) fs.mkdirSync("./rules", { recursive: true })

  // Crear archivo si no existe
  if (!fs.existsSync(permisosPath)) {
    fs.writeFileSync(permisosPath, JSON.stringify({}, null, 2))
  }

  try {
    const data = JSON.parse(fs.readFileSync(permisosPath, "utf-8"))
    return data
  } catch (err) {
    console.error("⚠️ Error leyendo permisos.json, reiniciando...", err)
    fs.writeFileSync(permisosPath, JSON.stringify({}, null, 2))
    return {}
  }
}

/**
 * Guarda los permisos en el archivo.
 */
function savePermisos(data) {
  fs.writeFileSync(permisosPath, JSON.stringify(data, null, 2))
}

/**
 * Devuelve el permiso actual de un chat (A, B, C o null)
 */
export function getPermiso(chatId) {
  const permisos = loadPermisos()
  return permisos[chatId]?.nivel || null
}

/**
 * Asigna un tipo de permiso a un chat (A, B o C)
 */
export function setPermiso(chatId, nivel, extraData = {}) {
  const permisos = loadPermisos()
  permisos[chatId] = {
    nivel,
    nombre: extraData.nombre || "Desconocido",
    fecha: new Date().toISOString(),
    ...extraData
  }
  savePermisos(permisos)
  return permisos[chatId]
}

/**
 * Verifica si un chat está autorizado
 */
export function isAutorizado(chatId) {
  const permisos = loadPermisos()
  return !!permisos[chatId]
}

/**
 * Elimina un chat del registro
 */
export function removePermiso(chatId) {
  const permisos = loadPermisos()
  if (permisos[chatId]) {
    delete permisos[chatId]
    savePermisos(permisos)
    return true
  }
  return false
}

export default {
  loadPermisos,
  savePermisos,
  getPermiso,
  setPermiso,
  isAutorizado,
  removePermiso
}