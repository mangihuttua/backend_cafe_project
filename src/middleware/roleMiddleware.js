export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Pastikan authentication middleware sudah berjalan
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu.",
      });
    }

    // Periksa role pengguna
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki izin untuk mengakses halaman ini.",
      });
    }

    next();
  };
};
