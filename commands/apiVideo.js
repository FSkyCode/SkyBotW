// commands/apiVideo.js
import axios from "axios"
import fs from "fs"
import path from "path"

export default {
  name: "!apivideo",
  description: "Busca un video usando una API de terceros. Uso: !apiVideo <texto>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid
    const texto = args.join(" ")

    if (!texto) {
      await sock.sendMessage(remoteJid, { 
        text: "❗ Uso: *!apiVideo <busqueda>*" 
      })
      return
    }

    await sock.sendMessage(remoteJid, {
      text: `🔍 Consultando API...\n📌 Buscando: *${texto}*`
    })

    try {
      // ===========================================
      // 🔵 AQUI PEGAS LA API QUE QUIERAS USAR
      // ===========================================
      const apiUrl = `https://tu-api.com/search?q=${encodeURIComponent(texto)}`
      const res = await axios.get(apiUrl)

      if (!res.data?.results?.length) {
        await sock.sendMessage(remoteJid, {
          text: "⚠️ No se encontraron resultados."
        })
        return
      }

      const videoURL = res.data.results[0].video_url

      if (!videoURL) {
        await sock.sendMessage(remoteJid, {
          text: "⚠️ La API no devolvió un enlace de video válido."
        })
        return
      }

      // ===========================================
      // DESCARGA DEL VIDEO
      // ===========================================
      const tempPath = path.join("./data", `api_${Date.now()}.mp4`)
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
          caption: `🎬 Resultado basado en: ${texto}`
        })

        fs.unlinkSync(tempPath)
      })

      writer.on("error", async () => {
        await sock.sendMessage(remoteJid, { 
          text: "❌ Error guardando archivo." 
        })
      })

    } catch (e) {
      console.log(e)
      await sock.sendMessage(remoteJid, { 
        text: "❌ No se pudo obtener información de la API." 
      })
    }
  }
}