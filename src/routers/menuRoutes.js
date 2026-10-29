import express from "express";
import { getMenus,
         getMenuById,
         createMenu,
         updateMenu,
         deleteMenu } from "../Controllers/menuController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET semua menu
router.get("/", getMenus);

// GET menu berdasarkan ID
router.get("/:id", getMenuById);

// Endpoint khusus admin

// CREATE menu
router.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  createMenu
);

// UPDATE menu
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  updateMenu
);

// DELETE menu
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  deleteMenu
);

export default router;
