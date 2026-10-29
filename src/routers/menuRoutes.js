
import express from "express";
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../Controllers/menuController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMenuImages.js";

const router = express.Router();

router.get("/", getMenus);
router.get("/:id", getMenuById);

router.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("image"),
  createMenu
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("image"),
  updateMenu
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  deleteMenu
);

export default router;
