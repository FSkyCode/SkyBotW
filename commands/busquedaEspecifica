// commands/busquedaEspecifica.js
import axios from "axios"
import fs from "fs"
import path from "path"

export default {
  name: "!busquedaespecifica",
  description: "Descarga y envía un video desde una URL directa. Uso: !busquedaEspecifica <url>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const url = args[0]

    if (!url) {
      await sock.sendMessage(remoteJid, { text: "❗ Uso: *!busquedaEspecifica <url>*" })
      return
    }

    await sock.sendMessage(remoteJid, { text: `📥 Descargando video...\n🔗 URL: ${url}` })

    try {
      // archivo temporal único
      const tempPath = path.join("./data", `direct_${Date.now()}.mp4`)
      const writer = fs.createWriteStream(tempPath)

      const download = await axios({
        url,
        method: "GET",
        responseType: "stream"
      })

      download.data.pipe(writer)

      writer.on("finish", async () => {
        try {
          await sock.sendMessage(remoteJid, {
            video: fs.readFileSync(tempPath),
            caption: "🎬 Video enviado correctamente."
          })
        } catch (sendErr) {
          console.log(sendErr)
          await sock.sendMessage(remoteJid, { text: "❌ Error enviando el archivo." })
        }

        fs.unlinkSync(tempPath)
      })

      writer.on("error", async () => {
        await sock.sendMessage(remoteJid, { text: "❌ Error al guardar el archivo." })
      })

    } catch (e) {
      console.log(e)
      await sock.sendMessage(remoteJid, { text: "❌ No se pudo descargar el video." })
    }
  }
}