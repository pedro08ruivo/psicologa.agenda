const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "../build/index.html");
const notFoundPath = path.join(__dirname, "../build/404.html");

fs.copyFileSync(indexPath, notFoundPath);
console.log("404.html criado para rotas do GitHub Pages.");
