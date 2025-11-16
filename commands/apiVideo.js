import fetch from "node-fetch"
import fs from "fs"
import path from "path"

export default {
  name: "!apivideo",
  description: "Busca un video +18 usando la API de Eporner. Uso: !buscarVideo <palabra>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      await sock.sendMessage(remoteJid, {
        text: "❌ Escribe algo para buscar.\nEjemplo: *!buscarVideo latina*"
      })
      return
    }

    try {
      // 🔍 Llamar a la API
      const apiUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=1&format=json`
      const res = await fetch(apiUrl)
      const data = await res.json()

      if (!data.videos || data.videos.length === 0) {
        await sock.sendMessage(remoteJid, { text: "⚠️ No se encontró ningún video." })
        return
      }

      const video = data.videos[0]
      const mp4 = video.mp4["720p"] || video.mp4["480p"] || video.mp4["240p"]

      if (!mp4) {
        await sock.sendMessage(remoteJid, { text: "❌ No hay MP4 disponible para este video." })
        return
      }

      // 📥 Descargar
      const tempPath = path.join("/sdcard", `video_${Date.now()}.mp4`)
      const videoRes = await fetch(mp4)
      const fileStream = fs.createWriteStream(tempPath)

      await new Promise((resolve, reject) => {
        videoRes.body.pipe(fileStream)
        videoRes.body.on("error", reject)
        fileStream.on("finish", resolve)
      })

      // 📤 Enviar
      await sock.sendMessage(remoteJid, {
        video: { url: tempPath },
        caption: `🎬 *${video.title}*\n\n📎 Fuente: Eporner`
      })

      // 🧽 Borrar archivo
      fs.unlinkSync(tempPath)

    } catch (error) {
      console.error(error)
      await sock.sendMessage(remoteJid, {
        text: "❌ Error al buscar el video."
      })
    }
  }
}