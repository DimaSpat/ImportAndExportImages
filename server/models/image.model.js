const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  fullResData: Buffer,
  thumbnailData: Buffer,
  contentType: String,
  filename: String,
});

module.exports = mongoose.model("Image", imageSchema);
