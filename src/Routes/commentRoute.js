const Comment = require("../models/Comment");
const authenticateToken = require("../middleware/authenticateToken");
const User = require("../models/User");

const express = require("express");
const Post = require("../models/Post");
const commentRouter = express.Router();

commentRouter.post(
  "/posts/:postId/comments",
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);

      const newComment = new Comment({
        content: req.body.content,
        username: user.username,
        author: req.user.userId,
        post: req.params.postId,
      });
      const comment = await newComment.save();

      // Update user's comments array
      await User.findByIdAndUpdate(req.user.userId, {
        $push: { comments: comment._id },
      });

      // Update the issue's comments array
      await Post.findByIdAndUpdate(req.params.postId, {
        $push: { comments: comment._id },
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: "Comment creation failed" + error });
    }
  }
);

// Route to get comments made by the logged-in user
commentRouter.get(
  "/user/:userId/my-comments",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Find all post IDs that the user has commented on
      const postIds = await Comment.find({ author: userId }).distinct("post"); // Get distinct post IDs

      // Fetch posts that are not authored by the user
      const posts = await Post.find({
        _id: { $in: postIds }, // Filter to only the posts where the user has commented
        author: { $ne: userId }, // Exclude posts authored by the user
      }).populate({
        path: "comments",
        populate: { path: "author", select: "username" }, // Populate comment author details
      });

      // Respond with the filtered posts
      res.status(200).json(posts);
    } catch (error) {
      // Respond with an error message if fetching comments fails
      res
        .status(500)
        .json({ error: "Failed to fetch user comments: " + error.message });
    }
  }
);

module.exports = commentRouter;
