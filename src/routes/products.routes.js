import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Router } from "express";

const router = Router();

const productsPath = path.join(
  import.meta.dirname,
  "..",
  "data",
  "products.json",
);

const productsData = fs.readFileSync(productsPath, "utf-8");
const products = JSON.parse(productsData);

function createNewHash(cont) {
  const contOK = String(cont);
  const hash = crypto.createHash("sha256").update(contOK).digest("hex");
  return hash;
}

class Product {
  constructor(
    pid,
    title,
    description,
    code,
    price,
    status,
    stock,
    category,
    thumbnails,
  ) {
    this.pid = pid;
    this.title = title;
    this.description = description;
    this.code = code;
    this.price = price;
    this.status = status;
    this.stock = stock;
    this.category = category;
    this.thumbnails = thumbnails;
  }
}
const validations = [
  {
    field: "title",
    type: "string",
    message: "El título debe ser de tipo string.",
  },
  {
    field: "description",
    type: "string",
    message: "La descripción debe ser de tipo string.",
  },
  {
    field: "code",
    type: "string",
    message: "El código debe ser de tipo string.",
  },
  {
    field: "price",
    type: "number",
    message: "El precio debe ser de tipo number.",
  },
  {
    field: "status",
    type: "boolean",
    message: "El estado debe ser de tipo booleano.",
  },
  {
    field: "stock",
    type: "number",
    message: "El stock debe ser de tipo number.",
  },
  {
    field: "category",
    type: "string",
    message: "La categoría debe ser de tipo string.",
  },
];

router.get("/", (req, res) => {
  try {
    const { category } = req.query;

    let result = products;

    if (category) {
      result = products.filter((pr) => pr.category === category);
    }

    return res.status(200).json({ success: true, payload: result });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:pid", (req, res) => {
  try {
    const { pid } = req.params;
    const product = products.find((pr) => pr.pid === pid);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product con ID ${pid} no encontrado.`,
      });
    }

    return res.status(200).json({ success: true, payload: product });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", (req, res) => {
  const reqTitle = req.body.title;
  const reqDescription = req.body.description;
  const reqCode = req.body.code;
  const reqPrice = req.body.price;
  const reqStatus = req.body.status;
  const reqStock = req.body.stock;
  const reqCategory = req.body.category;
  const reqThumbnails = req.body.thumbnails;
  const hashedPid = createNewHash(reqCode);

  try {
    const repeatedCode = products.some((pr) => pr.code === reqCode);
    const newProduct = new Product(
      hashedPid,
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

    if (repeatedCode === true) {
      return res.status(400).json({
        success: false,
        error: "El código debe ser único por producto.",
      });
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
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:pid", (req, res) => {
  try {
    const pid = req.params.pid;
    const productIndex = products.findIndex((pr) => pr.pid === pid);

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${pid}.` });
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
      pid,
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
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/:pid", (req, res) => {
  try {
    const pid = req.params.pid;
    const index = products.findIndex((pr) => pr.pid === pid);

    if (index === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${pid}.` });
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
      pid,
    };

    products[index] = updatedProduct;
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(200).json({ success: true, payload: updatedProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/:pid", (req, res) => {
  try {
    const pid = req.params.pid;
    const productIndex = products.findIndex((pr) => pr.pid === pid);

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe producto con ID ${pid}.` });
    }

    const [deletedProduct] = products.splice(productIndex, 1);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    return res.status(200).json({ success: true, payload: deletedProduct });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/", (req, res) => {
  try {
    products.length = 0;
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    return res.status(200).json({ success: true, payload: products });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}.`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
