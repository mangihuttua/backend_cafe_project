
import pool from "../config/database.js";

// GET semua menu
export const getMenus = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id ASC"
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("Error mengambil menu:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data menu",
    });
  }
};

// GET menu berdasarkan ID
export const getMenuById = async (req, res) => {
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail menu",
    });
  }
};

// CREATE MENU
export const createMenu = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
    } = req.body || {};

    const parsedPrice = Number(price);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === "" ||
      !Number.isSafeInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Nama menu, kategori, dan harga harus valid",
      });
    }

    const imageName = req.file?.filename || null;

    const result = await pool.query(
      `INSERT INTO menu_items
       (title, description, price, category, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title.trim(),
        description || "",
        parsedPrice,
        category.trim(),
        imageName,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Menu berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error menambahkan menu:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan menu",
    });
  }
};


// UPDATE menu

export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category } = req.body || {};
    const parsedPrice = Number(price);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === "" ||
      !Number.isSafeInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Nama menu, kategori, dan harga harus valid",
      });
    }

    // Cari gambar menu yang tersimpan saat ini.
    const existing = await pool.query(
      "SELECT image FROM menu_items WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu tidak ditemukan",
      });
    }

    // Jika ada gambar baru, gunakan nama file baru.
    // Jika tidak, pertahankan gambar lama.
    const imageName =
      req.file?.filename ?? existing.rows[0].image;

    const result = await pool.query(
      `UPDATE menu_items
       SET title = $1,
           description = $2,
           price = $3,
           category = $4,
           image = $5
       WHERE id = $6
       RETURNING *`,
      [
        title.trim(),
        description || "",
        parsedPrice,
        category.trim(),
        imageName,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Menu berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error update menu:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui menu",
    });
  }
};


// DELETE menu
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM menu_items WHERE id = $1 RETURNING *",
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
      message: "Menu berhasil dihapus",
    });

  } catch (error) {
    console.error("Error menghapus menu:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus menu",
    });
  }
};
