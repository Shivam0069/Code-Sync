const userModel = require("../models/user.model");
const { validationResult } = require("express-validator");

module.exports.registerUser = async (req, res, next) => {
  try {
    // Validate the request body for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userName, email, password } = req.body;

    // Check if a user with the given email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await userModel.hashPassword(password);

    // Create a new user
    const user = await userModel.create({
      userName,
      email,
      password: hashedPassword,
    });

    // Generate an authentication token
    const token = user.generateAuthToken();

    // Sanitize the user object
    const sanitizedUser = {
      userName: user.userName,
      email: user.email,
      _id: user._id,
    };

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 3600000, // 1 hour
    });

    // Return the response
    res.status(201).json({
      user: sanitizedUser,

      message: "User registered successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await userModel
      .findOne({ email })
      .select("+password")
      .populate("files");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // If the password is invalid, return a 401 status with an error message
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Generate an authentication token for the user
    const token = user.generateAuthToken();
    // Return a 200 status with the token and user details

    const sanitizedUser = {
      userName: user.userName,
      email: user.email,
      files: user.files,

      _id: user._id,
    };

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 3600000, // 1 hour
    });

    // Return the response
    res.status(201).json({
      user: sanitizedUser,

      message: "User logged in successfully!",
    });
  } catch (error) {
    // Log any errors to the console
    console.error(error);
    // Return a 500 status with an error message
    res.status(500).json({ message: "Internal Server Error" });
  }
};
