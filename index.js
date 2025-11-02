import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"

import P from "pino"
import fs from "fs"
import handler from "./handler.js"

// 🎨 Logger
const logger = P({ level: "silent" }) // Puedes poner "info" para ver más logs

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true, // ✅ Muestra el QR si no hay sesión guardada
    auth: state,
    browser: ["MiBot", "Desktop", "1.0.0"],
  })

  // 🔄 Guardar credenciales automáticamente
  sock.ev.on("creds.update", saveCreds)

  // 📥 Evento de mensajes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages[0]
    
    await handler(sock, mensaje)
  })

  // ⚡ Manejo de desconexiones
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log("⚠️ Conexión cerrada, reconectando:", shouldReconnect)
      if (shouldReconnect) iniciarBot()
      else console.log("🚪 Sesión cerrada manualmente o inválida.")
    } else if (connection === "open") {
      console.log("✅ Bot conectado exitosamente.")
    }
  })

  // 🧠 Comprobación inicial
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  if (!fs.existsSync("./data/registros.json"))
    fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2))
}

// 🚀 Iniciar el bot
iniciarBot()