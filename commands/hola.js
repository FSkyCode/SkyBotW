import nivel2 from '../rules/nivel2.js'  // ⬅️ Importas la regla que quieras

export default {
  name: '!hola',
  description: 'Responde con un saludo.',
  rules: [nivel2], // ✅ puedes agregar aquí las reglas que este comando requiere
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: '--SKY BOT RESPONDIENDO-- ¡Hola humano!' })
  }
}
