import fs from "fs"
import path from "path"

const gruposPath = path.resolve("./rules/grupos.json")

export default {
  name: '!listarGrupos',
  description: 'Muestra todos los grupos autorizados. (Nivel 2)',
  nivel: 2, // 🔹 Indicamos que este comando pertenece al nivel 2
  execute: async (sock, msg) => {
    if (!fs.existsSync(gruposPath)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "📭 No hay grupos registrados aún."
      })
      return
    }

    const grupos = JSON.parse(fs.readFileSync(gruposPath, "utf-8"))
    const keys = Object.keys(grupos)

    if (!keys.length) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "📭 No hay grupos registrados."
      })
      return
    }

    const lista = keys
      .map((id, i) => `${i + 1}. ${grupos[id].nombre || "Sin nombre"}\n   🆔 ${id}`)
      .join("\n\n")

    await sock.sendMessage(msg.key.remoteJid, {
      text: `--SKY BOT RESPONDIENDO-- 📜 *Grupos Autorizados:*\n\n${lista}`
    })
  }
}