const authenticateToken = require("../middleware/authenticateToken");
const Post = require("../models/Post");
const express = require("express");
const User = require("../models/User");
const postRouter = express.Router();
const Comment = require("../models/Comment");

// Create Post
postRouter.post("/createPost", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const post = new Post({
      title: req.body.title,
      description: req.body.description,
      username: user.username,
      author: req.user.userId,
      location: {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude], // Longitude, Latitude (e.g., New York City)
      },
    });
    await post.save();
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { posts: post._id },
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: "Post creation failed", error });
  }
});

postRouter.get(
  "/user/:userId/my-posts",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const posts = await Post.find({ author: userId }).populate("comments"); // Fetch user posts and populate comments
      res.status(200).json(posts);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  }
);

postRouter.get("/posts", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { longitude, latitude, page = 1 } = req.query; // Expect page parameter for pagination

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ error: "Longitude and latitude are required." });
    }

    const postsPerPage = 5; // Number of posts per page
    // Calculate the skip value for pagination
    const skip = (page - 1) * postsPerPage;

    // Fetch all posts excluding those by the authenticated user
    const posts = await Post.find({
      author: { $ne: userId },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // Longitude, Latitude
          },
          $maxDistance: 50000, // 50 km
        },
      },
    })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order (most recent first)
      .skip(skip) // Skip the previous pages' posts
      .limit(postsPerPage) // Limit the number of posts per page
      .populate({
        path: "comments",
        populate: { path: "author", select: "username avatar" },
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Route to get a post with all its comments populated
postRouter.get("/posts/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate({
      path: "comments",
      populate: { path: "author", select: "username" },
    });
    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ error: "Issue not found" });
  }
});

// Route to edit a post
postRouter.put("/posts/:postId", authenticateToken, async (req, res) => {
  const { title, description } = req.body;

  try {
    // Find the post by ID
    const post = await Post.findById(req.params.postId);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the logged-in user is the author of the post
    if (post.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this post" });
    }

    // Update the post with new title and description
    post.title = title || post.title;
    post.description = description || post.description;
    post.Edited = true;

    // Save the updated post
    await post.save();

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    res.status(500).json({ message: "Failed to update post", error: error });
  }
});

// Route to delete a post (issue)
postRouter.delete("/posts/:postId", authenticateToken, async (req, res) => {
  try {
    // Find the issue by ID
    const post = await Post.findById(req.params.postId);

    // Check if issue exists
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the logged-in user is the author of the post
    if (post.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this post" });
    }

    await Comment.deleteMany({ _id: { $in: post.comments } });
    // If authorized, delete the post
    await post.deleteOne();
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { posts: post._id },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error: error });
  }
});

module.exports = postRouter;
