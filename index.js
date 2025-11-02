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

  // socket inicial (sin QR por defecto). Si hace falta mostramos QR luego.
  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: ["SkyBotW", "Desktop", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  // mensajes
  sock.ev.on("messages.upsert", async (m) => {
    const mensaje = m.messages?.[0];
    if (!mensaje?.message) return;
    try { if (handler) await handler(sock, mensaje); } catch (e) { logger.error(e) }
  });

  sock.ev.on("connection.update", (u) => {
    logger.info({ u }, "connection.update");
    const { connection, lastDisconnect } = u;
    if (connection === "open") logger.info("✅ Bot conectado exitosamente.");
    else if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info("⚠️ Conexión cerrada, reconectando:", shouldReconnect);
      if (shouldReconnect) iniciarBot();
      else logger.info("🚪 Sesión cerrada o inválida.");
    }
  });

  // Si no existe sesión -> intentar pairing por código con reintentos y fallback a QR
  if (!fs.existsSync("./session/creds.json")) {
    const phone = await ask("📱 Ingresa tu número de WhatsApp (sin +, ej: 573001234567): ");
    if (!phone) { console.log("Número inválido."); process.exit(1); }

    // Esperar a que el socket esté algo inicializado
    await new Promise((r) => setTimeout(r, 1500));

    const maxAttempts = 4;
    let paired = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`Intento ${attempt}/${maxAttempts} para solicitar pairing code...`);
        const code = await sock.requestPairingCode(phone); // puede lanzar si socket no listo
        console.log("=========================================");
        console.log("🔗 VINCULACIÓN POR CÓDIGO");
        console.log("👉 En tu WhatsApp ve a:");
        console.log("Configuración → Dispositivos vinculados → Vincular con número de teléfono");
        console.log(`📱 Ingresa este código: ${code}`);
        console.log("=========================================");
        paired = true;
        break;
      } catch (err) {
        logger.warn({ err }, `Error al pedir pairing code (intento ${attempt})`);
        // esperar un poco antes del siguiente intento, con backoff
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }

    if (!paired) {
      // fallback: activar QR (más fiable)
      console.log("⚠️ No se pudo generar código luego de varios intentos. Mostrando QR como fallback.");
      // cerramos el socket y creamos uno nuevo con printQRInTerminal true
      try { sock.end(); } catch (e) {}
      const sockQR = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: true,
        browser: ["SkyBotW", "Desktop", "1.0.0"],
      });
      sockQR.ev.on("creds.update", saveCreds);
      sockQR.ev.on("connection.update", (u) => logger.info({ u }, "QR socket update"));
      // attach same handlers to new socket
      sockQR.ev.on("messages.upsert", async (m) => {
        const mensaje = m.messages?.[0];
        if (!mensaje?.message) return;
        try { if (handler) await handler(sockQR, mensaje); } catch (e) { logger.error(e) }
      });
    }
  }

  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync("./data/registros.json")) fs.writeFileSync("./data/registros.json", JSON.stringify({}, null, 2));
}

iniciarBot().catch(e => { console.error("FATAL:", e); process.exit(1) });