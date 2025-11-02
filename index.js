import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import readline from "readline";
import handler from "./handler.js";

// 🎨 Logger
const logger = P({ level: "info" });

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  let phoneNumber;

  // 🔢 Pedir número solo si no hay sesión previa
  if (!fs.existsSync("./session/creds.json")) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    phoneNumber = await new Promise((resolve) => {
      rl.question("📱 Ingresa tu número de WhatsApp (sin +, ej: 573001234567): ", (num) => {
        rl.close();
        resolve(num.trim());
      });
    });
  }

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ["SkyBotW", "Desktop", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // 📩 Manejo de mensajes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages[0];
    if (!mensaje?.message) return;
    await handler(sock, mensaje);
  });

  // ⚙️ Actualización de conexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ Bot conectado exitosamente.");
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Conexión cerrada, reconectando:", shouldReconnect);
      if (shouldReconnect) iniciarBot();
      else console.log("🚪 Sesión cerrada manualmente o inválida.");
    }
  });

// 👇 Esperar unos segundos antes de solicitar el código
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

    setTimeout(async () => {
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
    }, 2000);
  });
}
  // 📂 Crear data si no existe
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json"))
    fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

// 🚀 Iniciar bot
iniciarBot();
