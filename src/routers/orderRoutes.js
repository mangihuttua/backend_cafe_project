import express from "express";
import { createOrder } from "../Controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);

export default router;