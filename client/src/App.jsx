import React, { useState, useEffect } from 'react';
import axios from 'axios';

import "./styles.css";

function App() {
  const [images, setImages] = useState([]);
  const [fullResLoaded, setFullResLoaded] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  // Fetch all image metadata when the component mounts
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/import');
        setImages(response.data);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  // Handle image file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle image upload
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/api/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage("Image uploaded successfully!");

      // Fetch updated list of images after successful upload
      const newImageResponse = await axios.get('http://localhost:5000/api/import');
      setImages(newImageResponse.data);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadMessage("Error uploading image.");
    }
  };

  // Load full-resolution image after thumbnail has loaded
  const loadFullRes = (id, index) => {
    axios.get(`http://localhost:5000/api/import/${id}`, {
      responseType: 'arraybuffer', // Expecting binary data
    })
    .then(response => {
      const blob = new Blob([response.data], { type: 'image/webp' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.src = url;

      // Once the full-resolution image is loaded, replace the thumbnail
      img.onload = () => {
        setFullResLoaded(prev => {
          const newLoaded = [...prev];
          newLoaded[index] = url; // Store the full-res image URL
          return newLoaded;
        });
      };
    })
    .catch(error => {
      console.error('Error loading full-resolution image:', error);
    });
  };

  return (
    <div>
      <h1>Image Upload and Display</h1>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit">Upload Image</button>
      </form>
      <p>{uploadMessage}</p>
      
      <h2>Uploaded Images</h2>
      <div className='grid'>
        {images.map((image, index) => (
          <div key={image._id} className='blur-load'>
            <img
              src={`http://localhost:5000/api/import/thumbnail/${image._id}`}
              alt="Thumbnail"
              style={{
                display: fullResLoaded[index] ? 'none' : 'block',
              }}
              onLoad={() => loadFullRes(image._id, index)}
              className='low-res'
            />
            {fullResLoaded[index] && (
              <img
                src={fullResLoaded[index]}
                alt="Full resolution"
                loading='lazy'
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;