// index.js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import fs from "fs"
import handler from "./handler.js"

const filePath = './lastActivity.json'
let lastActivity = {}

// 🔹 Cargar datos previos si existen
if (fs.existsSync(filePath)) {
  lastActivity = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 🔹 Guardar actividad
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
    if (msg.key.fromMe) return // Evita duplicados

    await handler(sock, msg, lastActivity, saveActivity)
  })
}

// 🔹 Guardar al cerrar
process.on('SIGINT', () => {
  console.log('\n🛑 Bot detenido. Guardando datos...')
  fs.writeFileSync(filePath, JSON.stringify(lastActivity, null, 2))
  process.exit()
})

startBot()