// commands/buscarVideo.js
import axios from "axios"
import fs from "fs"
import path from "path"

export default {
  name: "!video",
  description: "Busca un video por palabra clave. Uso: !video <texto>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const texto = args.join(" ")

    if (!texto) {
      await sock.sendMessage(remoteJid, { text: "❗ Uso correcto: *!video <busqueda>*" })
      return
    }

    await sock.sendMessage(remoteJid, {
      text: `🔍 Buscando video sobre: *${texto}*...`
    })

    try {
      const urlAPI = `https://api.pexels.com/videos/search?query=${encodeURIComponent(texto)}&per_page=1`

      const res = await axios.get(urlAPI, {
        headers: {
          Authorization: "563492ad6f9170000100000123456789abcdef12"
        }
      })

      const videos = res.data.videos
      if (!videos?.length) {
        await sock.sendMessage(remoteJid, { text: "⚠️ No encontré resultados." })
        return
      }

      const videoURL = videos[0].video_files[0].link

      const tempPath = path.join("./data", `temp_${Date.now()}.mp4`)
      const writer = fs.createWriteStream(tempPath)

      const download = await axios({
        url: videoURL,
        method: "GET",
        responseType: "stream"
      })

      download.data.pipe(writer)

      writer.on("finish", async () => {
        await sock.sendMessage(remoteJid, {
          video: fs.readFileSync(tempPath),
          caption: `🎬 Resultado encontrado: ${texto}`
        })
        fs.unlinkSync(tempPath)
      })

    } catch (e) {
      console.log(e)
      await sock.sendMessage(remoteJid, { text: "❌ Error descargando o enviando el video." })
    }
  }
}