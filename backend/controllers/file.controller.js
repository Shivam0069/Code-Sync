const { validationResult } = require("express-validator");
const File = require("../models/file.model");
const userModel = require("../models/user.model");

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
    });

    // Find the user and update their files array
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.files.push(file._id);
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

    // Check if the user is the creator of the file
    const user = await userModel.findById(req.user._id);
    if (!user || !user.files.includes(fileId)) {
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
