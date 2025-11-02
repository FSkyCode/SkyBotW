import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import readline from "readline";
import handler from "./handler.js";

const logger = P({ level: "info" });

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a.trim()); }));
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  // Pregunta al usuario si desea QR o código
  let metodo = await ask("🔰 Elige el método de vinculación:\nA: QR\nB: Código\n👉 ");
  metodo = metodo.trim().toUpperCase();

  // socket base (sin QR por defecto)
  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ["Android", "Chrome", "2.3000.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // manejar mensajes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages?.[0];
    if (!mensaje?.message) return;
    try { if (handler) await handler(sock, mensaje); } catch (e) { logger.error(e) }
  });

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === "open") logger.info("✅ Bot conectado exitosamente.");
    else if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info("⚠️ Conexión cerrada, reconectando:", shouldReconnect);
      if (shouldReconnect) iniciarBot();
      else logger.info("🚪 Sesión cerrada o inválida.");
    }
  });

  // Si no hay sesión
  if (!fs.existsSync("./session/creds.json")) {
    if (metodo === "A") {
      console.log("📸 Modo QR seleccionado. Escanea el código para vincular tu WhatsApp.\n");
      const sockQR = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: true,
        browser: ["SkyBotW", "Desktop", "1.0.0"],
      });
      sockQR.ev.on("creds.update", saveCreds);
      sockQR.ev.on("connection.update", (u) => logger.info({ u }, "QR socket update"));
      sockQR.ev.on("messages.upsert", async (m) => {
        const mensaje = m.messages?.[0];
        if (!mensaje?.message) return;
        try { if (handler) await handler(sockQR, mensaje); } catch (e) { logger.error(e) }
      });
    } else if (metodo === "B") {
      console.log("⚙️ Modo Código aún no disponible. Por ahora usa la opción A (QR).");
      process.exit(0);
    } else {
      console.log("❌ Opción inválida. Reinicia y elige A o B.");
      process.exit(0);
    }
  }

  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json")) fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

iniciarBot().catch(e => { console.error("FATAL:", e); process.exit(1) });