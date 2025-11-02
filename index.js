import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"

import P from "pino"
import fs from "fs"
import handler from "./handler.js"

// 🎨 Logger
const logger = P({ level: "silent" }) // Cambia a "info" si querés ver más detalles

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false, // 🚫 Desactivamos QR, solo usaremos código
    browser: ["SkyBotW", "Desktop", "1.0.0"],
  })

  // 🔄 Guardar credenciales automáticamente
  sock.ev.on("creds.update", saveCreds)

  // 📩 Evento de mensajes entrantes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages[0]
    if (!mensaje?.message) return
    await handler(sock, mensaje)
  })

  // ⚙️ Actualización de conexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, pairingCode } = update

    // 🔢 Si se genera un código, lo mostramos
    if (pairingCode) {
      console.log("=========================================")
      console.log("🔗 VINCULACIÓN POR CÓDIGO")
      console.log("👉 En tu WhatsApp ve a:")
      console.log("Configuración → Dispositivos vinculados → Vincular con número de teléfono")
      console.log(`📱 Ingresa este código: ${pairingCode}`)
      console.log("=========================================")
    }

    if (connection === "open") {
      console.log("✅ Bot conectado exitosamente.")
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log("⚠️ Conexión cerrada, reconectando:", shouldReconnect)
      if (shouldReconnect) iniciarBot()
      else console.log("🚪 Sesión cerrada manualmente o inválida.")
    }
  })

  // 🧠 Crear carpetas y archivos necesarios si no existen
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  if (!fs.existsSync("./data/registros.json"))
    fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2))
}

// 🚀 Iniciar el bot
iniciarBot()