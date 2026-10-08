import bcrypt from "bcrypt";
import pool from "../config/database.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validasi input
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    // 2. Memeriksa apakah email sudah terdaftar
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan data user ke database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        "user",
      ]
    );

    // 5. Respon
    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal melakukan registrasi",
    });
  }
};