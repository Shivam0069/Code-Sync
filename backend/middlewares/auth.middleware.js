const userModel = require("../models/user.model"); // Import the user model
const jwt = require("jsonwebtoken"); // Import jsonwebtoken for token handling
module.exports.authUser = async (req, res, next) => {
  // Export the authUser middleware function
  try {
    // Get the token from cookies or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      // If no token is found, return a 401 Unauthorized response
      return res
        .status(401)
        .json({ message: "Unauthorized", error: "Token not found" });
    }

    // Check if the token is blacklisted
    // const isBlacklisted = await BlacklistTokenModel.exists({ token });
    // if (isBlacklisted) {
    //   // If the token is blacklisted, return a 401 Unauthorized response
    //   return res
    //     .status(401)
    //     .json({ message: "Unauthorized", error: "Token is blacklisted" });
    // }

    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      // Find the user by the ID from the decoded token
      const user = await userModel.findById(decoded._id);
      if (!user) {
        // If the user is not found, return a 401 Unauthorized response
        return res
          .status(401)
          .json({ message: "Unauthorized", error: "User not found" });
      }
      req.user = user; // Attach the user to the request object
      return next(); // Proceed to the next middleware or route handler
    } catch (jwtError) {
      // If token verification fails, return a 401 Unauthorized response
      return res
        .status(401)
        .json({ message: "Unauthorized", error: "Invalid token" });
    }
  } catch (error) {
    // If any other error occurs, return a 500 Internal Server Error response
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
