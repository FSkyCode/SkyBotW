// expressions/saludar.js
export default {
  name: "!saludar",
  description: "Envía un saludo amistoso a alguien o a ti mismo.",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const pushName = msg.pushName || "Usuario desconocido"

    let texto = ""

    if (mentions.length > 0) {
      // 👋 Saludo dirigido
      texto = `👋 ¡Hola, @${mentions[0].split('@')[0]}! ${pushName} te manda un saludo.`
    } else if (args.length > 0) {
      // 🗣️ Si alguien escribe algo como "!saludar Juan"
      const nombre = args.join(" ")
      texto = `👋 ¡Hola, ${nombre}! ${pushName} te manda un saludo.`
    } else {
      // 🙌 Sin argumentos: se saluda a sí mismo
      texto = `🙌 ¡Hola, @${sender.split('@')[0]}! Espero que tengas un gran día.`
    }

    await sock.sendMessage(remoteJid, {
      text: texto,
      mentions: mentions.length > 0 ? mentions : [sender]
    })
  }
}