const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const authRouter = express.Router();
// Registration
authRouter.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        error: { message: `${field} already exists. Please choose another.` },
      });
    } else {
      res.status(400).json({ message: "Registration failed", error });
    }
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordValid)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, "YOUR_SECRET_KEY", {
    expiresIn: "1h",
  });
  res.cookie("token", token, { maxAge: 7200000000 });
  //   res.json({ token });
  res.status(200).json({
    message: "You are logged in successfully!",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    token,
  });
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null);
  res.status(200).json({
    message: "You are logged in successfully!",
    user: null,
  });
});

authRouter.get("/profile", authenticateToken, async (req, res) => {
  try {
    // Fetch the user from the database using the userId from the token
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ error: "User not found" });

    // Send user information excluding sensitive data
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Change Password
authRouter.post("/changePassword", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the user from the database using the userId from the token
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Compare the old password with the hashed password in the database
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: "Old password is incorrect!" });
    }

    // Hash the new password before saving it to the database
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    // Return a success message
    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ error: "An error occurred while changing the password." });
  }
});

authRouter.put(
  "/profile/update-avatar",
  authenticateToken,
  async (req, res) => {
    const { avatar } = req.body;
    const userId = req.user.userId;

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar },
        { new: true }
      );
      console.log("avatar changed");
      res.status(200).json({
        message: "Avatar updated successfully",
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to update avatar" });
    }
  }
);

module.exports = authRouter;
