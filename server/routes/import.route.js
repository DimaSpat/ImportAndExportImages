const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const mongoose = require("mongoose");
const Image = require("../models/image.model"); // Import the Image model

// Multer storage configuration (store files in memory for processing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST route to handle image upload, conversion, and thumbnail creation
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert the image to WebP format (full resolution)
    const webpBuffer = await sharp(req.file.buffer).webp().toBuffer();

    // Create a 64x64 thumbnail
    const thumbnailBuffer = await sharp(req.file.buffer)
      .resize(16, 16) // Resize to 64x64 pixels
      .webp() // Convert to WebP
      .toBuffer();

    // Save the full resolution and thumbnail image in the database
    const newImage = new Image({
      fullResData: webpBuffer, // Full resolution WebP image
      thumbnailData: thumbnailBuffer, // 64x64 WebP thumbnail
      contentType: "image/webp", // MIME type for both images
      filename: req.file.originalname, // Optional: original filename
    });

    await newImage.save();

    res.status(200).json({ message: "Image uploaded and saved successfully", imageId: newImage._id });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET route to retrieve a 64x64 thumbnail image by ID
router.get("/thumbnail/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Thumbnail not found" });
    }

    res.set("Content-Type", image.contentType);
    res.send(image.thumbnailData);
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET route to retrieve a full-resolution image by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid image ID" });
  }

  try {
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set("Content-Type", image.contentType);
    res.send(image.fullResData); // Send the full-resolution image
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET route to retrieve all images (metadata only, not the actual image data)
router.get("/", async (req, res) => {
  try {
    const images = await Image.find({}, '_id filename'); // Only return _id and filename for now
    res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
