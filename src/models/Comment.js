const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required."],
      minlength: [3, "Content must be at least 3 characters long."],
      maxlength: [300, "Content cannot exceed 300 characters."],
      trim: true,
    },
    username: { type: String, required: true, minlength: 3, maxlength: 12 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    createdAt: { type: Date, default: Date.now },
    Edited: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
