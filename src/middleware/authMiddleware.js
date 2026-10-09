
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // 1. Ambil token dari header Authorization
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // 2. Pastikan token tersedia
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token tidak ditemukan. Silakan login.",
    });
  }

  // 3. Verifikasi token
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 4. Simpan data user untuk digunakan oleh endpoint
    req.user = decoded;

    // 5. Lanjutkan ke handler berikutnya
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa.",
    });
  }
};
