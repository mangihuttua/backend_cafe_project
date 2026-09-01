import pool from "../config/database.js";

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
    console.error("Error mengambil data menu:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data menu",
    });
  }
};
