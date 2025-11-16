// commands/apiSearch.js
import axios from "axios";
import fs from "fs";
import path from "path";

export default {
  name: "!apivideo",
  description: "Ejemplo de cómo usar API search. Uso: !apisearch <texto>",

  async execute(sock, msg, args) {
    const remoteJid = msg.key.remoteJid;
    const texto = args.join(" ");

    if (!texto) {
      await sock.sendMessage(remoteJid, { text: "Uso: !apisearch <texto>" });
      return;
    }

    // Consulta técnica a la API
    const url = `https://www.cdnsurado.com/api/v2/video/search/?query=${encodeURIComponent(texto)}&per_page=1&page=1&format=json`;

    const resp = await axios.get(url);

    const video = resp.data.videos?.[0];

    await sock.sendMessage(remoteJid, {
      text: `🔍 API respondió:\n\nID: ${video?.id}\nTítulo: ${video?.title}`
    });
  }
};