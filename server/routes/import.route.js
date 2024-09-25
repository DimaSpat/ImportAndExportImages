const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const Image = require('../models/image.model');

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to convert image to WebP and save to MongoDB
const convertToWebPAndSave = async (file) => {
  const webpBuffer = await sharp(file.buffer)
    .webp({ quality: 80 })
    .toBuffer();

  const imageDoc = new Image({
    fullResData: webpBuffer,
    contentType: 'image/webp',
    filename: file.originalname,
  });

  await imageDoc.save();
  return imageDoc;
};

// Helper function to create a 64x64 thumbnail and save to MongoDB
const createThumbnail = async (file) => {
  const thumbnailBuffer = await sharp(file.buffer)
    .resize(64, 64)
    .webp({ quality: 50 })
    .toBuffer();

  return thumbnailBuffer; // Return thumbnail buffer to be saved later
};

// Route for handling multiple image uploads
router.post('/', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    const savedImages = [];

    for (let file of files) {
      const thumbnail = await createThumbnail(file);
      const webpImage = await convertToWebPAndSave(file);

      // Update the saved image with the thumbnail
      webpImage.thumbnailData = thumbnail;
      await webpImage.save(); // Save the updated document with thumbnail data
      savedImages.push(webpImage);
    }

    res.status(200).json({ message: "Images uploaded successfully", images: savedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Error uploading images' });
  }
});

// Route to get all images (only metadata)
router.get('/', async (req, res) => {
  try {
    const images = await Image.find();
    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Route to serve thumbnail image
router.get('/thumbnail/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || !image.thumbnailData) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }
    res.set('Content-Type', image.contentType);
    res.send(image.thumbnailData);
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    res.status(500).json({ error: 'Error fetching thumbnail' });
  }
});

// Route to serve full-resolution image
router.get('/full/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || !image.fullResData) {
      return res.status(404).json({ error: 'Full-resolution image not found' });
    }
    res.set('Content-Type', image.contentType);
    res.send(image.fullResData);
  } catch (error) {
    console.error('Error fetching full-resolution image:', error);
    res.status(500).json({ error: 'Error fetching full-resolution image' });
  }
});

module.exports = router;
