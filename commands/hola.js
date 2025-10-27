export default {
  name: '!hola',
  description: 'Responde con un saludo.',
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: '--SKY BOT RESPONDIENDO-- ¡Hola humano!' })
  }
}
