// commands/establecerBot.js
import { setPermiso, getPermiso } from "../rules/permisos.js"

export default {
  name: "!establecerbot",
  description: "Autoriza este chat para usar el bot. Uso: !establecerBot <A|B|C>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const sender = msg.key.participant || remoteJid
    const pushName = msg.pushName || "Desconocido"
    const isGroup = remoteJid.endsWith("@g.us")
    const code = args[0]?.toUpperCase() || null

    if (!code || !["A", "B", "C"].includes(code)) {
      await sock.sendMessage(remoteJid, {
        text: "❌ Uso incorrecto. Ejemplo: *!establecerBot A*\n\nTipos disponibles:\n🅰️ Chat privado\n🅱️ Grupo normal\n🇨 Comunidad (grupo principal)"
      })
      return
    }

    // 🔒 Verificar si ya está registrado
    const permisoActual = getPermiso(remoteJid)
    if (permisoActual) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Este chat ya fue registrado con nivel *${permisoActual}*.`
      })
      return
    }

    // 🔍 Validaciones según tipo
    if (code === "A" && isGroup) {
      await sock.sendMessage(remoteJid, {
        text: "❌ El código A solo puede usarse en chats privados."
      })
      return
    }

    if ((code === "B" || code === "C") && !isGroup) {
      await sock.sendMessage(remoteJid, {
        text: "❌ Los códigos B y C solo pueden usarse en grupos."
      })
      return
    }

    // ✅ Registrar permiso
    const nuevo = setPermiso(remoteJid, code, { nombre: pushName, creador: sender })

    await sock.sendMessage(remoteJid, {
      text: `✅ *Bot establecido correctamente*\n\n🔹 Tipo: ${code}\n🏷️ Nombre: ${pushName}\n🆔 ID: ${remoteJid}\n📅 Fecha: ${nuevo.fecha}`
    })

    // 🌍 Respuesta especial según tipo
    if (code === "B") {
      await sock.sendMessage(remoteJid, {
        text: "👥 Este grupo ha sido autorizado como *grupo general*. Los comandos ahora están habilitados."
      })
    }

    if (code === "C") {
      await sock.sendMessage(remoteJid, {
        text: "🌐 Este grupo ha sido establecido como *grupo principal de la comunidad*. El bot podrá interactuar con los demás grupos conectados."
      })
    }

    if (code === "A") {
      await sock.sendMessage(remoteJid, {
        text: "💬 Este chat privado ahora puede recibir mensajes del bot."
      })
    }
  }
}