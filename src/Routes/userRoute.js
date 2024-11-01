const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming User schema is in models/User.js
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
      res
        .status(400)
        .json({
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
      username: user.username, // Assuming the user schema has a 'name' field
      email: user.email,
      // add other non-sensitive fields here if needed
    },
    token, // Include the token here if you also want to access it client-side
  });
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null);
  res.status(200).json({
    message: "You are logged in successfully!",
    user: null,
  });
});

// Assuming this is within your authRouter file
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
      // Add any other fields you want to expose
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

module.exports = authRouter;
