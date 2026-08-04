import express from "express";
import {
  changePassword,
  getMe,
  loginUser,
  updateProfile,
} from "../controller/authController.js";
import {authMiddleware} from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;
