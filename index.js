import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import readline from "readline";
import handler from "./handler.js"; // Asegúrate de tener este archivo o elimina esta línea si no lo usas

const logger = P({ level: "info" });

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false, // Ya no usaremos QR
    browser: ["SkyBotW", "Desktop", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // 📩 Escucha de mensajes entrantes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages[0];
    if (!mensaje?.message) return;
    if (handler) await handler(sock, mensaje);
  });

  // ⚙️ Conexión y reconexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") console.log("✅ Bot conectado exitosamente.");
    else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Conexión cerrada, reconectando:", shouldReconnect);
      if (shouldReconnect) iniciarBot();
      else console.log("🚪 Sesión cerrada manualmente o inválida.");
    }
  });

  // 🆕 Si no existe sesión previa → pedir número y mostrar código
  if (!fs.existsSync("./session/creds.json")) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("📱 Ingresa tu número de WhatsApp (sin +, ej: 573001234567): ", async (num) => {
      rl.close();
      const phone = num.trim();

      if (!phone) {
        console.log("❌ No ingresaste un número válido.");
        process.exit(1);
      }

      try {
        const code = await sock.requestPairingCode(phone);
        console.log("=========================================");
        console.log("🔗 VINCULACIÓN POR CÓDIGO");
        console.log("👉 En tu WhatsApp ve a:");
        console.log("Configuración → Dispositivos vinculados → Vincular con número de teléfono");
        console.log(`📱 Ingresa este código: ${code}`);
        console.log("=========================================");
      } catch (e) {
        console.error("❌ Error al solicitar código:", e);
      }
    });
  }

  // 📂 Crear carpeta de datos si no existe
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json"))
    fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

// 🚀 Iniciar bot
iniciarBot();