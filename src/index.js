const fs = require("fs");
const path = require("path");
const http = require("http");

const productsPath = path.join(__dirname, "data", "products.json");
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    return res.end("Home");
  } else if (req.url === "/productos") {
    const products = fs.readFileSync(productsPath, "utf-8");
    res.setHeader("Content-Type", "application/json");
    return res.end(products);
  }

  res.end("404 - Page Not Found");
});

server.listen(8080, () =>
  console.log("Server corriendo en http://localhost:8080"),
);
