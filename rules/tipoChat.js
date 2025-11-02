// rules/tipoChat.js
export const tipoChat = (msg) => {
  const id = msg.key.remoteJid || ''
  if (id.endsWith('@s.whatsapp.net')) return 'privado'
  if (id.endsWith('@g.us')) return 'grupo'
  if (id.includes('community')) return 'comunidad' // detección genérica, depende del cliente
  return 'desconocido'
}