import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/database.js";
import menuRoutes from "./routers/menuRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// test database connection
pool.query("SELECT NOW()")
  .then((result) => {
    console.log("Database berhasil terhubung");
    console.log("Database time:", result.rows[0]);
  })
  .catch((error) => {
    console.error("Database connection gagal:", error);
  });

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Cafe Delight API is running"
  });
});

// Menu Routes 
app.use("/api/menu", menuRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});