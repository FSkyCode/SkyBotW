import hola from "./hola.js"
import revisar from "./revisar.js"
import setGrupo from "./setGrupo.js"
import listargrupos from "./listargrupos.js"

export default {
  [hola.name]: hola,
  [revisar.name]: revisar,
  [setGrupo.name]: setGrupo,
  [listargrupos.name]: listargrupos
}
