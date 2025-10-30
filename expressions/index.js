// expressions/index.js
import fs from "fs"
import path from "path"

const expressions = {}
const folder = path.resolve("./expressions")

for (const file of fs.readdirSync(folder)) {
  if (file.endsWith(".js") && file !== "index.js") {
    const exp = await import(`./${file}`)
    expressions[exp.default.name] = exp.default
  }
}

export default expressions