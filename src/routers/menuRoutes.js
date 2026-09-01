import express from "express";
import { getMenus } from "../Controllers/menuController.js";

const router = express.Router();

router.get("/", getMenus);

export default router;