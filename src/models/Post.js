const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      minlength: [5, "Title must be at least 5 characters long."],
      maxlength: [100, "Title cannot exceed 100 characters."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      minlength: [10, "Description must be at least 10 characters long."],
      maxlength: [5000, "Description cannot exceed 5000 characters."],
      trim: true,
    },
    username: { type: String, required: true, minlength: 3, maxlength: 12 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    Edited: { type: Boolean, default: false },
    location: {
      type: {
        type: String,
        enum: ["Point"], // Must be "Point" for GeoJSON
        required: true,
      },
      coordinates: {
        type: [Number], // Array of numbers: [longitude, latitude]
        required: true,
        validate: {
          validator: function (val) {
            return val.length === 2; // Must contain exactly two elements
          },
          message: "Coordinates must contain longitude and latitude.",
        },
      },
    },
  },

  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

PostSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Post", PostSchema);
