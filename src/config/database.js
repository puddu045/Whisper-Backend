const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://prudhvi2890:BEK93RN4L1Aubw7S@rajdb.3dpx9.mongodb.net/Whisper"
  );
};

module.exports = connectDB;
