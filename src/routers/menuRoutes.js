import express from "express";
import { getMenus } from "../Controllers/menuController.js";
import pool from "../config/database.js";

const router = express.Router();

// GET semua menu
router.get("/", getMenus);

// GET menu berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM menu_items WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Error mengambil detail menu:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail menu",
    });
  }
});

export default router;