// index.js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import fs from "fs"
import commands from "./commands/index.js"
import reglas from "./reglas/index.js"

const filePath = './lastActivity.json'
let lastActivity = {}

// 🔹 Cargar datos previos si existen
if (fs.existsSync(filePath)) {
  lastActivity = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 🔹 Guardar actividad en JSON
const saveActivity = () => {
  fs.writeFileSync(filePath, JSON.stringify(lastActivity, null, 2))
}

// 🔹 Iniciar bot
const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Mac OS", "Chrome", "14.4.1"]
  })

  // 🔹 Estado de conexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log('📱 Escanea este QR con tu WhatsApp:')
      qrcode.generate(qr, { small: false })
    }
    if (connection === 'open') console.log('✅ Conectado a WhatsApp!')
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Conexión cerrada:', reason)
      if (reason !== DisconnectReason.loggedOut) startBot()
      else console.log('👋 Sesión cerrada. Borra ./session para volver a vincular.')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // 🔹 Escuchar mensajes
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message) return

    const sender = msg.key.participant || msg.key.remoteJid
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const isGroup = msg.key.remoteJid.endsWith('@g.us')
    const name = msg.pushName || sender
    const groupId = msg.key.remoteJid

    // 🔹 Guardar actividad y niveles solo si es grupo
    if (isGroup) {
      if (!lastActivity[groupId]) lastActivity[groupId] = {}
      if (!lastActivity[groupId][sender]) {
        lastActivity[groupId][sender] = { ts: 0, name, msgCount: 0 }
      }

      const userData = lastActivity[groupId][sender]
      userData.ts = msg.messageTimestamp * 1000
      userData.name = name
      userData.msgCount++

      // 🔹 Calcular nivel
      const oldLevel = Math.floor((userData.msgCount - 1) / 30) + 1
      const newLevel = Math.floor(userData.msgCount / 30) + 1

      // 🔹 Si sube de nivel → Notificación
      if (newLevel > oldLevel) {
        await sock.sendMessage(groupId, {
          text: `🎉 @${sender.split('@')[0]} ha subido de nivel a *${newLevel}* :D`,
          mentions: [sender]
        })
      }

      saveActivity()
    }

    // 🔹 Sistema modular de comandos
    const comando = texto.split(' ')[0].toLowerCase()
    const args = texto.split(' ').slice(1)

    // 🔹 Verificar reglas
    let permitido = true

    for (const regla of reglas) {
      const mensajeTexto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""

      // Siempre permitir !setgrupo
      if (mensajeTexto.startsWith('!setgrupo')) {
        permitido = true
      } else if (typeof regla.check === 'function') {
        permitido = regla.check(msg)
      } else {
        permitido = true
      }

      if (!permitido) {
        // No enviar mensaje de grupo no autorizado, solo ignorar
        return
      }
    }

    // 🔹 Ejecutar comando
    if (commands[comando]) {
      try {
        await commands[comando].execute(sock, msg, args, lastActivity, saveActivity)
      } catch (err) {
        console.error(`❌ Error ejecutando el comando ${comando}:`, err)
        await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Ocurrió un error al ejecutar el comando." })
      }
    }
  })
}

// 🔹 Guardar datos al cerrar con CTRL+C
process.on('SIGINT', () => {
  console.log('\n🛑 Bot detenido. Guardando última actividad...')
  saveActivity()
  process.exit()
})

startBot()
