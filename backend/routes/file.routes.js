const express = require("express");

const router = express.Router();

const { body } = require("express-validator");

const fileController = require("../controllers/file.controller");

const authMiddleware = require("../middlewares/auth.middleware");
router.post(
  "/create",
  [
    body("name")
      .isLength({ min: 3 })
      .withMessage("File Name Should be at least 3 character long"),
    body("content")
      .isLength({ min: 10 })
      .withMessage("File Content Must be 10 character long"),
  ],
  authMiddleware.authUser,
  fileController.create
);

router.put(
  "/update",
  [
    body("fileId").notEmpty().withMessage("File ID is required"),
    body("content")
      .isLength({ min: 10 })
      .withMessage("File Content Must be 10 character long"),
  ],
  authMiddleware.authUser,
  fileController.update
);

module.exports = router;
