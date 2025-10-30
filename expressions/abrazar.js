// expressions/abrazar.js
export default {
  name: '/abrazar',
  description: 'Abraza a un usuario',
  execute: async (sock, msg, args) => {
    const target = args[0] || ''
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🤗 ${msg.pushName} abrazó ${target}!`
    })
  }
}