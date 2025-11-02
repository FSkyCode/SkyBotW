// handler.js
import comandos from "./commands/index.js"
import expresiones from "./expressions/index.js"
import permisos from "./rules/permisos.js"
import { detectType } from "./utils/detectType.js"

export default async function handler(sock, msg) {
  const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
  if (!texto || texto.trim() === "") return // Ignorar mensajes vacíos

  if (texto.startsWith("!")) console.log("📩 Comando detectado:", texto)

  // Detectar datos básicos
  const comando = texto.trim().split(" ")[0].toLowerCase()
  const args = texto.split(" ").slice(1)
  const remoteJid = msg.key.remoteJid
  const sender = msg.key.participant || msg.key.remoteJid
  const name = msg.pushName || sender

  // 🔍 Detectar tipo de chat (privado o grupo)
  const tipo = await detectType(sock, msg)

  // ⚙️ Solo procesar si empieza con "!"
  if (!texto.startsWith("!")) return

  // 🔐 Verificar permisos
  const permitido = permisos.isAutorizado(remoteJid)

  // 🚫 Si no tiene permiso y no es !establecerbot, salir sin spam
  if (!permitido && comando !== "!establecerbot") {
    // Solo responder 1 vez por chat no autorizado
    const aviso = `⚠️ Este chat no está autorizado.\nUsa *!establecerBot <código>* para vincularlo.`
    console.log(`⛔ Chat sin permiso (${remoteJid})`)
    await sock.sendMessage(remoteJid, { text: aviso })
    return
  }

  // ----------------------------
  // 🧩 EJECUCIÓN DE COMANDOS
  // ----------------------------
  if (comandos[comando]) {
    const cmd = comandos[comando]
    try {
      await cmd.execute(sock, msg, args, tipo)
    } catch (err) {
      console.error(`❌ Error ejecutando ${comando}:`, err)
      await sock.sendMessage(remoteJid, { text: "⚠️ Ocurrió un error al ejecutar el comando." })
    }
    return
  }

  // ----------------------------
  // 💬 EJECUCIÓN DE EXPRESIONES
  // ----------------------------
  if (expresiones[comando]) {
    const exp = expresiones[comando]
    try {
      await exp.execute(sock, msg, args, tipo)
    } catch (err) {
      console.error(`❌ Error en expresión ${comando}:`, err)
      await sock.sendMessage(remoteJid, { text: "⚠️ No pude procesar tu expresión." })
    }
    return
  }

  // ❓ Si no es ningún comando ni expresión conocida
  await sock.sendMessage(remoteJid, { text: "🤖 Comando no reconocido." })
}