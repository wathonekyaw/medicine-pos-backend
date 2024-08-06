const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

const db = mysql.createConnection({
  host: "localhost",
  user: "pos",
  password: "Qf223322",
  database: "pos",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected");
  }
});

// Ensure the uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server error");
    } else {
      res.json(results);
    }
  });
});

// New route to fetch a product by ID
app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM products WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server error");
    } else if (results.length === 0) {
      res.status(404).send("Product not found");
    } else {
      res.json(results[0]);
    }
  });
});

app.post("/api/products", upload.array("multipleImage", 10), (req, res) => {
  const {
    name,
    code,
    brand,
    price,
    unit,
    stock,
    warehouse,
    supplier,
    status,
    productCategory,
    barcodeSymbology,
    saleUnit,
    quantityLimitation,
    productType,
    note,
  } = req.body;
  const createdOn = new Date();

  if (!name || !code || !brand || !price || !unit || !stock) {
    return res.status(400).send("All fields are required");
  }

  const images = req.files ? req.files.map((file) => file.path) : [];

  const query =
    "INSERT INTO products (name, code, brand, price, unit, stock, warehouse, supplier, status, productCategory, barcodeSymbology, saleUnit, quantityLimitation, productType, note, images, createdOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [
      name,
      code,
      brand,
      price,
      unit,
      stock,
      warehouse,
      supplier,
      status,
      productCategory,
      barcodeSymbology,
      saleUnit,
      quantityLimitation,
      productType,
      note,
      JSON.stringify(images),
      createdOn,
    ],
    (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        res.status(500).send("Server error");
      } else {
        res.status(201).json({ id: results.insertId });
      }
    }
  );
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, code, brand, price, unit, stock } = req.body;

  if (!name || !code || !brand || !price || !unit || !stock) {
    return res.status(400).send("All fields are required");
  }

  const query =
    "UPDATE products SET name = ?, code = ?, brand = ?, price = ?, unit = ?, stock = ? WHERE id = ?";
  db.query(
    query,
    [name, code, brand, price, unit, stock, id],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Server error");
      } else {
        res.status(200).json({ message: "Product updated successfully" });
      }
    }
  );
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM products WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server error");
    } else {
      res.status(204).send();
    }
  });
});

app.listen(port, () => {
  console.log(`My POS Server running on port ${port}.....`);
});
