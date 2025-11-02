import comandos from "./commands/index.js"
import expresiones from "./expressions/index.js"
import permisos from "./rules/permisos.js"
import { detectType } from "./utils/detectType.js"
export default async function handler(sock, msg) {
  const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
  const comando = texto.trim().split(" ")[0].toLowerCase()
  const args = texto.split(" ").slice(1)
  const remoteJid = msg.key.remoteJid
  const sender = msg.key.participant || msg.key.remoteJid
  const name = msg.pushName || sender

  
console.log("📩 Comando detectado:", texto)
  // 🔍 Detectar tipo de chat
const tipo = await detectType(sock, msg)
  // 🔐 Permisos
  const permitido = await permisos.verificar(remoteJid)

  // 🚫 Si no tiene permiso y no es !establecerBot, salir
  if (!permitido && comando !== "!establecerbot") {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Este chat no está autorizado. Usa *!establecerBot <código>* para vincularlo."
    })
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

  // ❓ Si no es ningún comando conocido
  await sock.sendMessage(remoteJid, { text: "🤖 Comando no reconocido." })
}
