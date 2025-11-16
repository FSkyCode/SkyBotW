// commands/index.js
import establecerBot from "./establecerBot.js"
import busquedaEspecifica from "./busquedaEspecifica.js"
import video from "./buscarVideo.js"
import apiVideo from "./apiVideo.js"

export default {
  "!establecerbot": establecerBot,
  "!busquedaespecifica": busquedaEspecifica,
  "!video": video,
  "!apivideo": apiVideo,
}