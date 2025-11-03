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

  if (metodo !== "A") {
    console.log("❌ Solo el método A (QR) está disponible por ahora.");
    process.exit(0);
  }

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ["SkyBotW", "Desktop", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📸 Escanea este QR desde tu WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") logger.info("✅ Bot conectado exitosamente.");
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info("⚠️ Conexión cerrada, reconectando:", shouldReconnect);
      if (shouldReconnect) iniciarBot();
      else logger.info("🚪 Sesión cerrada o inválida.");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages?.[0];
    if (!mensaje?.message) return;
    try { if (handler) await handler(sock, mensaje); } catch (e) { logger.error(e); }
  });

  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json")) fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

iniciarBot().catch(e => { console.error("FATAL:", e); process.exit(1); });