const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator"); // Import validator.js

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: [3, "Username must be at least 3 characters long."], // Minimum length
    maxlength: [12, "Username cannot exceed 20 characters."], // Maximum length
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9_]+$/.test(v); // Alphanumeric and underscores only
      },
      message: (props) => `${props.value} is not a valid username!`,
    },
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long."], // Minimum length
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(v); // At least one lowercase, one uppercase, and one number
      },
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    },
  }, // Use hashing for security
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[\w.%+-]+@[A-Za-z0-9.-]+\.(com|net|org|edu|gov|mil|biz|info)$/i.test(
          v
        );
        // return validator.isEmail(v); // Valid email format
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  createdAt: { type: Date, default: Date.now },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }], // Optional: To track user's posts
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

module.exports = mongoose.model("User", UserSchema);
