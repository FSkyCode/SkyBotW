import reglas from "../reglas/index.js"

export default {
  name: '!listarGrupos',
  description: 'Muestra todos los grupos autorizados.',
  execute: async (sock, msg) => {
    const regla1 = reglas.find(r => r.name === "regla1_grupos")
    const grupos = regla1.getGrupos().gruposPermitidos

    if (!grupos.length) {
      await sock.sendMessage(msg.key.remoteJid, { text: "📭 No hay grupos registrados." })
      return
    }

    const lista = grupos.map((g, i) => `${i + 1}. ${g.nombre || "Sin nombre"}\n   🆔 ${g.id}`).join("\n\n")
    await sock.sendMessage(msg.key.remoteJid, { text: `--SKY BOT RESPONDIENDO--📜 *Grupos Autorizados:*\n\n${lista}` })
  }
}
