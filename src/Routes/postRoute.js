const authenticateToken = require('../middleware/authenticateToken');
const Post = require('../models/Post');
const express = require("express");
const User = require('../models/User');
const postRouter = express.Router();

// Create Post
postRouter.post('/posts', authenticateToken, async (req, res) => {
  try {
    const post = new Post({
      title: req.body.title,
      description: req.body.description,
      author: req.user.userId,
    });
    await post.save();
    await User.findByIdAndUpdate(req.user.userId, { $push: { posts: post._id } });
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: 'Post creation failed' });
  }
});

postRouter.get('/user/:userId/my-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ author: userId }).populate('comments'); // Fetch user posts and populate comments
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get all posts except those created by the authenticated user
postRouter.get('/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Fetch all posts excluding those by the authenticated user
    const posts = await Post.find({ author: { $ne: userId } }).populate({
      path: 'comments',
      populate: { path: 'author', select: 'username' } // Populate comment author details if needed
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});


// Route to get a post with all its comments populated
postRouter.get('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate({
      path: 'comments',
      populate: { path: 'author', select: 'username' } // Populate comment author details if needed
    });
    res.status(200).json(post);

  } catch (error) {
    res.status(404).json({ error: 'Issue not found' });
  }
});

// Route to delete a post (issue)
postRouter.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    // Find the issue by ID
    const post = await Post.findById(req.params.postId);

    // Check if issue exists
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the logged-in user is the author of the post
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    // If authorized, delete the post
    await post.deleteOne();
    await User.findByIdAndUpdate(req.user.userId, { $pull: { posts: post._id } });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});



module.exports = postRouter;