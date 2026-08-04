import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import type {Request, Response} from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({message: "Email dan password wajib diisi"});
    }

    const user = await prisma.user.findUnique({
      where: {email},
    });

    if (!user) {
      return res.status(401).json({message: "Email atau password salah"});
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({message: "Email atau password salah"});
    }

    const expiresIn = 60 * 60;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn,
      },
    );

    return res.status(200).json({
      message: "Login berhasil",
      token,
      expiresIn,

      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({message: "Login gagal"});
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {name, email} = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Nama dan email wajib diisi",
      });
    }

    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
    });

    if (emailExists) {
      return res.status(409).json({
        message: "Email sudah digunakan",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        name,
        email,
      },

      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
      },
    });

    return res.json({
      message: "Profile berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Gagal update profile",
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {newPassword, confirmPassword} = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Semua field password wajib diisi",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password baru minimal 8 karakter",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Konfirmasi password tidak sesuai",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // Mencegah password baru sama dengan password lama
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        message: "Password baru tidak boleh sama dengan password lama",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Gagal mengubah password",
    });
  }
};

// Get profile
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({message: "Unauthorized"});
    }

    const user = await prisma.user.findUnique({
      where: {id: userId},
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({message: "User tidak ditemukan"});
    }

    return res.status(200).json({
      message: "Data user berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({message: "Gagal mengambil data user"});
  }
};
