import fs from "fs";
import path from "path";
import express from "express";

// Settings
const app = express();
const productsPath = path.join(import.meta.dirname, "data", "products.json");
const data = fs.readFileSync(productsPath, "utf-8");
const products = JSON.parse(data);
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
const validations = [
  {
    field: "title",
    type: "String",
    message: "El título debe ser de tipo string.",
  },
  {
    field: "description",
    type: "String",
    message: "La descripción debe ser de tipo string.",
  },
  {
    field: "code",
    type: "String",
    message: "El código debe ser de tipo string.",
  },
  {
    field: "price",
    type: "Number",
    message: "El precio debe ser de tipo number.",
  },
  {
    field: "status",
    type: "Boolean",
    message: "El estado debe ser de tipo booleano.",
  },
  {
    field: "stock",
    type: "Number",
    message: "El stock debe ser de tipo number.",
  },
  {
    field: "category",
    type: "String",
    message: "La categoría debe ser de tipo string.",
  },
];

// Middlewares
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Hola, estás en la página principal" });
});

app.get("/api/products", (req, res) => {
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

app.get("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find((pr) => pr.id === id);

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

app.post("/api/products", (req, res) => {
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

    for (const { field, type, message } of validations) {
      if (typeof newProduct[field] !== type) {
        return res.status(400).json({ success: false, error: message });
      }
    }

    if (!Array.isArray(newProduct.thumbnails)) {
      return res
        .status(400)
        .json({ success: false, error: "Las miniaturas deben ser un array." });
    }

    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(201).json({ success: true, payload: newProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const productIndex = products.findIndex((pr) => pr.id === id);

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${id}.` });
    }

    for (const { field, type, message } of validations) {
      if (!(field in req.body)) {
        return res
          .status(400)
          .json({ success: false, error: `Falta el campo "${field}".` });
      }

      if (typeof req.body[field] !== type) {
        return res.status(400).json({ success: false, error: message });
      }
    }

    if (!("thumbnails" in req.body)) {
      return res
        .status(400)
        .json({ success: false, error: `Falta el campo "thumbnails".` });
    } else if (!Array.isArray(req.body.thumbnails)) {
      return res
        .status(400)
        .json({ success: false, error: "Las miniaturas deben ser un array." });
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

app.patch("/api/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = products.findIndex((pr) => pr.id === id);

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${id}.` });
    }

    const updates = req.body;

    for (const { field, type, message } of validations) {
      if (field in updates && typeof updates[field] !== type) {
        return res.status(400).json({ success: false, error: message });
      }
    }

    if ("thumbnails" in updates && !Array.isArray(updates.thumbnails)) {
      return res
        .status(400)
        .json({ success: false, error: "Las miniaturas deben ser un array." });
    }

    const updatedProduct = {
      ...products[index],
      ...updates,
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

app.delete("/api/products/:id", (req, res) => {
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
