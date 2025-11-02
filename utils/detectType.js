// utils/detectType.js
import fs from "fs"

const cachePath = "./data/groupCache.json"

/**
 * Detecta el tipo de chat: privado, grupo o comunidad
 * y devuelve datos estructurados.
 */
export default async function detectType(sock, msg) {
  const jid = msg.key.remoteJid
  const isGroup = jid.endsWith("@g.us")

  // 🔸 Si no existe carpeta data, la creamos
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true })
  if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, "{}")

  // 🔸 Leer cache local
  let cache = {}
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"))
  } catch {
    cache = {}
  }

  // 🔹 Chat privado
  if (!isGroup) {
    return {
      type: "private",
      id: jid,
      name: msg.pushName || "Usuario desconocido",
      parent: null
    }
  }

  // 🔹 Si el grupo está cacheado, devolvemos datos sin pedir a WhatsApp
  if (cache[jid]) return cache[jid]

  // 🔹 Si no está cacheado, pedimos los metadatos
  let metadata
  try {
    metadata = await sock.groupMetadata(jid)
  } catch (err) {
    console.warn(`⚠️ No se pudo obtener metadata del grupo ${jid}:`, err)
    return {
      type: "group",
      id: jid,
      name: "Grupo desconocido",
      parent: null
    }
  }

  // 🔹 Detectar si pertenece a comunidad
  const isCommunity = !!metadata?.community
  const parent = isCommunity ? metadata.community?.id || null : null

  const data = {
    type: isCommunity ? "community" : "group",
    id: jid,
    name: metadata.subject || "Grupo sin nombre",
    parent
  }

  // Guardar en cache para acelerar futuras detecciones
  cache[jid] = data
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))

  return data
}