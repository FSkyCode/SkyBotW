// utils/detectType.js
import fs from "fs"

const cachePath = "./data/groupCache.json"

/**
 * Detecta el tipo de chat: privado, grupo o comunidad
 * y devuelve datos estructurados.
 */

export async function detectType(sock, msg) {
  const jid = msg.key.remoteJid
  const isGroup = jid.endsWith("@g.us")

  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true })
  if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, "{}")

  let cache = {}
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"))
  } catch {
    cache = {}
  }

  if (!isGroup) {
    return {
      type: "private",
      id: jid,
      name: msg.pushName || "Usuario desconocido",
      parent: null
    }
  }

  if (cache[jid]) return cache[jid]

  let metadata
  try {
    metadata = await sock.groupMetadata(jid) // ✅ ahora está dentro de async
  } catch (err) {
    console.warn(`⚠️ No se pudo obtener metadata del grupo ${jid}:`, err)
    return {
      type: "group",
      id: jid,
      name: "Grupo desconocido",
      parent: null
    }
  }

  const isCommunity = !!metadata?.community
  const parent = isCommunity ? metadata.community?.id || null : null

  const data = {
    type: isCommunity ? "community" : "group",
    id: jid,
    name: metadata.subject || "Grupo sin nombre",
    parent
  }

  cache[jid] = data
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))

  return data
}