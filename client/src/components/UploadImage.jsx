import React, { useState } from 'react';
import axios from 'axios';

function UploadImage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");

  // Handle image file selection for multiple files
  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  // Handle image upload for multiple files
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFiles.length) {
      setUploadMessage("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    // Append all selected files to the FormData object
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("images", selectedFiles[i]);
    }

    try {
      await axios.post('http://localhost:5000/api/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage("Images uploaded successfully!");
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadMessage("Error uploading images.");
    }
  };

  return (
    <div>
      <h1>Upload Images</h1>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" onChange={handleFileChange} multiple />
        <button type="submit">Upload Images</button>
      </form>
      <p>{uploadMessage}</p>
    </div>
  );
}

export default UploadImage;
