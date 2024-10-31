const Comment = require("../models/Comment");
const authenticateToken = require("../middleware/authenticateToken");
const User = require("../models/User");

const express = require("express");
const Post = require("../models/Post");
const commentRouter = express.Router();

// Inside the create comment route
commentRouter.post(
  "/posts/:postId/comments",
  authenticateToken,
  async (req, res) => {
    try {
      console.log(req.user.userId);
      const newComment = new Comment({
        content: req.body.content,
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
      const postIds = await Comment.find({ author: userId })
        .populate("post")
        .distinct("post"); // Fetch user comments and populate related issues
      const posts = await Promise.all(
        postIds.map(async (postId) => {
          const post = await Post.findById(postId).populate({
            path: "comments",
            populate: { path: "author", select: "username" }, // Populate comment author details if needed
          });
          return post;
        })
      );

      const nonNullPosts = posts.filter((post) => post !== null);

      console.log(nonNullPosts);
      res.status(200).json(nonNullPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user comments" + error });
    }
  }
);

module.exports = commentRouter;
