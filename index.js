import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import readline from "readline";
import qrcode from "qrcode-terminal";
import handler from "./handler.js";

const logger = P({ level: "info" });

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans.trim()); }));
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  let metodo = await ask("🔰 Elige el método de vinculación:\nA: QR\nB: Código\n👉 ");
  metodo = metodo.toUpperCase();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: metodo === "A", // El QR solo aparece si escoges A
    browser: ["SkyBotW", "Desktop", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // -----------------------------
  // 🟦 MÉTODO B: GENERAR CÓDIGO
  // -----------------------------
  if (metodo === "B") {
    const telefono = await ask("📱 Ingresa tu número (sin +, ej: 573001234567): ");
    const jid = telefono + "@s.whatsapp.net";

    try {
      const codigo = await sock.requestPairingCode(jid);
      console.log("\n🔑 Tu código de vinculación es:", codigo);
      console.log("✔ WhatsApp → Dispositivos vinculados → Vincular → Usar código\n");
    } catch (err) {
      console.log("❌ Error generando código:", err);
      process.exit(1);
    }
  }

  // -----------------------------
  // 🔄 EVENTOS DE CONEXIÓN
  // -----------------------------
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && metodo === "A") {
      console.log("📸 Escanea este QR desde tu WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") logger.info("✅ Bot conectado exitosamente.");
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      logger.info("⚠️ Conexión cerrada, reconectando:", shouldReconnect);

      if (shouldReconnect) iniciarBot();
      else logger.info("🚪 Sesión cerrada o inválida.");
    }
  });

  // -----------------------------
  // 📩 MENSAJES ENTRANTES
  // -----------------------------
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages?.[0];
    if (!mensaje?.message) return;

    const from = mensaje.key.remoteJid;
    const texto =
      mensaje.message?.conversation ||
      mensaje.message?.extendedTextMessage?.text ||
      "";

    // -----------------------------
    // 🟦 "QUIERO SER BOT" → GENERAR CÓDIGO
    // -----------------------------
    if (texto.toLowerCase() === "quiero ser bot") {
      try {
        const codigo = await sock.requestPairingCode(from);

        await sock.sendMessage(from, {
          text:
            `🤖 *Código de vinculación generado*\n\n` +
            `🔑 *${codigo}*\n\n` +
            `Ve a:\n*WhatsApp → Dispositivos vinculados → Vincular → Usar código*\n\n` +
            `Tu número quedará vinculado como bot.`
        });

        return;
      } catch (e) {
        console.log("Error generando código:", e);
        await sock.sendMessage(from, { text: "❌ No pude generar tu código, intenta más tarde." });
        return;
      }
    }

    // -----------------------------
    // 🟦 HANDLER GENERAL DE COMANDOS
    // -----------------------------
    try {
      if (handler) await handler(sock, mensaje);
    } catch (e) {
      logger.error(e);
    }
  });

  // -----------------------------
  // 🗂 Carpeta data
  // -----------------------------
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json"))
    fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

iniciarBot().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});