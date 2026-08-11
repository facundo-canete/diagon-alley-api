import fs from "fs";
import path from "path";
import express from "express";

// Settings
const app = express();
const productsPath = path.join(import.meta.dirname, "data", "products.json");
const data = fs.readFileSync(productsPath, "utf-8");
const products = JSON.parse(data);

// Middlewares
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hola, estás en la página principal" });
});

app.get("/api/productos", (req, res) => {
  try {
    const { category } = req.query;

    let result = products;

    if (category) {
      result = products.filter((pr) => pr.category === category);
    }

    return res.status(200).json({ success: true, payload: result });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/productos/:code", (req, res) => {
  try {
    const { code } = req.params;
    const product = products.find((pr) => pr.code === code);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Producto no encontrado" });
    }

    return res.status(200).json({ success: true, payload: product });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/productos", (req, res) => {
  const newId =
    products.length > 0 ? Math.max(...products.map((pr) => pr.id)) + 1 : 1;
  const reqTitle = req.body.title;
  const reqDescription = req.body.description;
  const reqCode = req.body.code;
  const reqPrice = req.body.price;
  const reqStatus = req.body.status;
  const reqStock = req.body.stock;
  const reqCategory = req.body.category;
  const reqThumbnails = req.body.thumbnails;

  class Product {
    constructor(
      id,
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    ) {
      ((this.id = id),
        (this.title = title),
        (this.description = description),
        (this.code = code),
        (this.price = price),
        (this.status = status),
        (this.stock = stock),
        (this.category = category),
        (this.thumbnails = thumbnails));
    }
  }

  try {
    const newProduct = new Product(
      newId,
      reqTitle,
      reqDescription,
      reqCode,
      reqPrice,
      reqStatus,
      reqStock,
      reqCategory,
      reqThumbnails,
    );

    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(201).json({ success: true, payload: newProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/productos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const productIndex = products.findIndex((pr) => pr.id === id);

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${id}.` });
    }

    const updatedProduct = {
      id,
      title: req.body.title,
      description: req.body.description,
      code: req.body.code,
      price: req.body.price,
      status: req.body.status,
      stock: req.body.stock,
      category: req.body.category,
      thumbnails: req.body.thumbnails,
    };

    products[productIndex] = updatedProduct;
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(200).json({ success: true, payload: updatedProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.patch("/api/productos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = products.findIndex((pr) => pr.id === id);

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${id}.` });
    }

    const updatedProduct = {
      ...products[index],
      ...req.body,
      id,
    };

    products[index] = updatedProduct;
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(200).json({ success: true, payload: updatedProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/productos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const productIndex = products.findIndex((pr) => pr.id === id);

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${id}.` });
    }

    const [deletedProduct] = products.splice(productIndex, 1);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(200).json({ success: true, payload: deletedProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(8080, () =>
  console.log("Server corriendo en http://localhost:8080"),
);
