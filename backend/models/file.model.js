const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      default: ".txt",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
  },
  { timestamps: true }
); // Enable timestamps to automatically manage createdAt and updatedAt fields

const File = mongoose.model("File", fileSchema);

module.exports = File;
