import express from "express";

import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../Controllers/orderController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Customer 
router.post("/", createOrder);

// Admin
router.get(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  getAllOrders
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  getOrderById
);

router.put(
  "/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  updateOrderStatus
);

export default router;