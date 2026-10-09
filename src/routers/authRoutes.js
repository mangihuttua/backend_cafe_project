import express from "express";
import { register, login } from "../Controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/admin-test", authenticateToken, authorizeRole("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Akses admin berhasil",
    data: req.user,
  });
});

// Endpoint yang hanya bisa diakses dengan token valid
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token valid",
    data: req.user,
  });
});

export default router;