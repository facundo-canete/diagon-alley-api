import express from "express";
import productsRouter from "./routes/products.routes.js";
import cartsRouter from "./routes/carts.routes.js";

// Settings
const app = express();

// Middlewares
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hola, estás en la página principal" });
});

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// Server
app.listen(8080, () =>
  console.log("Server corriendo en http://localhost:8080"),
);
