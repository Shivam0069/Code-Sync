const { validationResult } = require("express-validator");
const File = require("../models/file.model");
const User = require("../models/user.model");
const { default: mongoose } = require("mongoose");

module.exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, content, extension } = req.body;

    // Create a new file document
    const file = await File.create({
      name,
      content,
      extension: extension || ".txt",
      ownerId: req.user._id,
    });

    // Find the user and update their files array
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const fileData = {
      fileId: file._id,
      name: file.name,
      extension: file.extension,
    };

    user.files.push(fileData);
    await user.save();

    res.status(201).json({ message: "File created successfully", file });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fileId, content } = req.body;

    // Find the file by ID
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);
    if (!file.ownerId.equals(userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this" });
    }

    // Check if the user is the creator of the file
    const user = await User.findById(req.user._id);
    if (
      !user ||
      !user.files.some((file) => file.fileId.toString() === fileId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update the file content
    file.content = content;
    await file.save();

    res.status(200).json({ message: "File updated successfully", file });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};
module.exports.getFileById = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    console.log("fileId", fileId);

    // Find the file by ID
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!file.ownerId.equals(userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this file" });
    }

    res.status(200).json({ file });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};
module.exports.delete = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Find the file by ID
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!file.ownerId.equals(userId)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this file" });
    }

    // Remove the file from the user's files array
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.files = user.files.filter((file) => file.fileId.toString() !== fileId);
    await user.save();
    // Delete the file
    await file.deleteOne();
    const userData = await User.findById(req.user._id);

    res
      .status(200)
      .json({ user: userData, message: "File deleted successfully" });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};
