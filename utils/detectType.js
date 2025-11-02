// utils/detectType.js
export default async function detectType(sock, msg) {
  const jid = msg.key.remoteJid
  const isGroup = jid.endsWith('@g.us')

  // 🔹 Chat privado
  if (!isGroup) {
    return {
      type: 'private',
      id: jid,
      name: msg.pushName || 'Usuario desconocido',
      parent: null
    }
  }

  // 🔹 Grupo
  let metadata = null
  try {
    metadata = await sock.groupMetadata(jid)
  } catch {
    // Si falla, devolvemos lo básico
    return {
      type: 'group',
      id: jid,
      name: 'Grupo desconocido',
      parent: null
    }
  }

  // 🔹 Comunidad
  // En WhatsApp las comunidades tienen un grupo principal (announcement group)
  // y los subgrupos se asocian con el campo "community"
  const isCommunity = !!metadata?.community
  const parent = isCommunity ? metadata.community?.id || null : null

  return {
    type: isCommunity ? 'community' : 'group',
    id: jid,
    name: metadata.subject || 'Grupo sin nombre',
    parent
  }
}