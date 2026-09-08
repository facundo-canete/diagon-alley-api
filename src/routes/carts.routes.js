import fs, { readFile } from "fs";
import path from "path";
import crypto from "crypto";
import { Router } from "express";

// Settings
const router = Router();
const productsPath = path.join(
  import.meta.dirname,
  "..",
  "data",
  "products.json",
);
const cartsPath = path.join(import.meta.dirname, "..", "data", "carts.json");

const productsData = fs.readFileSync(productsPath, "utf-8");
const cartsData = fs.readFileSync(cartsPath, "utf-8");

const products = JSON.parse(productsData);
const carts = JSON.parse(cartsData);

function createNewHash(cont) {
  const contOK = String(cont);
  const hash = crypto.createHash("sha256").update(contOK).digest("hex");
  return hash;
}

class Cart {
  constructor(cid, products, total) {
    this.cid = cid;
    this.products = products;
    this.total = total;
  }
}

class ProductToCart {
  constructor(pid, details, price, quantity, subtotal) {
    this.pid = pid;
    this.details = details;
    this.price = price;
    this.quantity = quantity;
    this.subtotal = subtotal;
  }
}

const cartItemValidations = [
  {
    field: "pid",
    type: "string",
    message: "El ID del producto debe ser de tipo string.",
  },
  {
    field: "quantity",
    type: "number",
    message: "La cantidad debe ser de tipo number.",
  },
];

// Routes
// Ver todos los carritos
router.get("/", (req, res) => {
  try {
    if (!carts) {
      return res.status(404).json({
        success: false,
        error: "No hay carritos.",
      });
    }

    return res.status(200).json({ success: true, payload: carts });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Ver un solo carrito
router.get("/:cid", (req, res) => {
  try {
    const { cid } = req.params;
    const cart = carts.find((cr) => cr.cid === cid);

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: `Carrito con ID ${cid} no encontrado.`,
      });
    }

    return res.status(200).json({ success: true, payload: cart });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un carrito
router.post("/", (req, res) => {
  try {
    const newCid =
      carts.length > 0 ? Math.max(...carts.map((cr) => cr.cid)) + 1 : 1;
    const hashedCid = createNewHash(newCid);

    const newCart = new Cart(hashedCid, [], 0);

    carts.push(newCart);
    fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));

    return res.status(201).json({ success: true, payload: newCart });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Agregar un producto a un carrito
router.post("/:cid/products/:pid", (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;
    const productQnty = Number(quantity);

    const cartIndex = carts.findIndex((cr) => cr.cid === cid);
    const cart = carts[cartIndex];

    const productIndex = products.findIndex((pr) => pr.pid === pid);
    let product = products[productIndex];

    if (cartIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Carrito no encontrado." });
    } else if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Producto no encontrado." });
    } else if (product.stock === 0 || product.status === false) {
      return res
        .status(400)
        .json({ success: false, error: "Producto no disponible." });
    }

    if (!Number.isInteger(productQnty) || productQnty <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad debe ser un número entero positivo.",
      });
    } else if (productQnty > product.stock) {
      return res.status(400).json({
        success: false,
        error:
          "La cantidad seleccionada excede el stock disponible del producto.",
      });
    }

    const existingIndex = cart.products.findIndex((p) => p.pid === pid);

    if (existingIndex === -1) {
      const newProductInCart = new ProductToCart(
        pid,
        {
          title: product.title,
          description: product.description,
          code: product.code,
          category: product.category,
          thumbnails: product.thumbnails,
        },
        product.price,
        productQnty,
        product.price * productQnty,
      );

      cart.products.push(newProductInCart);
    } else {
      cart.products[existingIndex].quantity += productQnty;
      cart.products[existingIndex].subtotal =
        cart.products[existingIndex].price *
        cart.products[existingIndex].quantity;
    }

    const updatedStock = product.stock - productQnty;
    let updatedProduct = undefined;
    if (updatedStock === 0) {
      updatedProduct = {
        ...product,
        stock: updatedStock,
        status: false,
      };
    } else if (updatedStock > 0) {
      updatedProduct = {
        ...product,
        stock: updatedStock,
      };
    }
    products[productIndex] = updatedProduct;
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));

    return res.status(201).json({ success: true, payload: cart });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Actualizar todos los productos del carrito
router.put("/:cid", (req, res) => {
  try {
    const { cid } = req.params;

    const cartIndex = carts.findIndex((cr) => cr.cid === cid);
    const cart = carts[cartIndex];

    if (cartIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: `No existe carrito con ID ${cid}.` });
    }

    const rawProducts = req.body.products;

    if (!Array.isArray(rawProducts)) {
      return res.status(400).json({
        success: false,
        error: "El campo products debe ser un array.",
      });
    }

    for (const item of rawProducts) {
      for (const { field, type, message } of cartItemValidations) {
        if (!(field in item)) {
          return res
            .status(400)
            .json({ success: false, error: `Falta el campo "${field}".` });
        } else if (typeof item[field] !== type) {
          return res.status(400).json({ success: false, error: message });
        }
      }
    }

    const mergedProducts = rawProducts.reduce((acc, item) => {
      const existingProduct = acc.find((p) => p.pid === item.pid);
      if (existingProduct) {
        existingProduct.quantity += item.quantity;
      } else {
        acc.push({ pid: item.pid, quantity: item.quantity });
      }

      return acc;
    }, []);

    for (const prod of mergedProducts) {
      const productIndex = products.findIndex((pr) => pr.pid === prod.pid);
      const product = products[productIndex];

      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          error: `Producto con ID ${prod.pid} no encontrado.`,
        });
      }

      const itemEnCarritoViejo = cart.products.find((p) => p.pid === prod.pid);
      const cantidadADevolver = itemEnCarritoViejo
        ? itemEnCarritoViejo.quantity
        : 0;
      const stockDisponible = product.stock + cantidadADevolver;

      if (stockDisponible === 0) {
        return res
          .status(400)
          .json({ success: false, error: "Producto no disponible." });
      } else if (prod.quantity > stockDisponible) {
        return res.status(400).json({
          success: false,
          error: `La cantidad solicitada para el producto ${prod.pid} excede el stock disponible.`,
        });
      }
    }

    const productosEnCarrito = [...cart.products];

    for (const prodDevuelto of productosEnCarrito) {
      const productIndex = products.findIndex(
        (pr) => pr.pid === prodDevuelto.pid,
      );
      const product = products[productIndex];

      product.stock = product.stock + prodDevuelto.quantity;
      if (product.status === false) {
        product.status = true;
      }
    }

    cart.products = [];

    for (const newProductToCart of mergedProducts) {
      const productIndex = products.findIndex(
        (p) => p.pid === newProductToCart.pid,
      );
      const product = products[productIndex];
      const addedProduct = new ProductToCart(
        newProductToCart.pid,
        {
          title: product.title,
          description: product.description,
          code: product.code,
          category: product.category,
          thumbnails: product.thumbnails,
        },
        product.price,
        newProductToCart.quantity,
        product.price * newProductToCart.quantity,
      );

      cart.products.push(addedProduct);

      const updatedStock = product.stock - newProductToCart.quantity;
      let updatedProduct = undefined;
      if (updatedStock === 0) {
        updatedProduct = {
          ...product,
          stock: updatedStock,
          status: false,
        };
      } else if (updatedStock > 0) {
        updatedProduct = {
          ...product,
          stock: updatedStock,
        };
      }

      products[productIndex] = updatedProduct;
    }

    cart.total = cart.products.reduce((acc, p) => acc + p.subtotal, 0);

    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));

    return res.status(200).json({ success: true, payload: cart });
  } catch (error) {
    console.error(`Hubo un error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar únicamente la cantidad de un producto
router.put("/:cid/products/:pid", (req, res) => {
  try {
  } catch (error) {}
});

// Vaciar el carrito completo
router.delete("/:cid", (req, res) => {
  try {
  } catch (error) {}
});

// Eliminar producto del carrito
router.delete("/:cid/products/:pid", (req, res) => {
  try {
  } catch (error) {}
});

export default router;
