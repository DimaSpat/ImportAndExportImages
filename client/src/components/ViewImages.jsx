import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import "./ViewImages.css";

function ViewImages() {
  const [images, setImages] = useState([]);
  const [fullResLoaded, setFullResLoaded] = useState([]);
  const [thumbnailLoaded, setThumbnailLoaded] = useState([]);
  const imageRefs = useRef([]);
  const loadedImages = useRef(new Set()); // Track loaded images

  // Fetch all image metadata when the component mounts
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/import');
        setImages(response.data);
        setFullResLoaded(new Array(response.data.length).fill(false));
        setThumbnailLoaded(new Array(response.data.length).fill(false));
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  // Load full-resolution image after thumbnail has loaded
  const loadFullRes = (id, index) => {
    if (loadedImages.current.has(id)) return; // Prevent duplicate loading

    loadedImages.current.add(id); // Mark this image as loading
    axios.get(`http://localhost:5000/api/import/full/${id}`, {
      responseType: 'arraybuffer',
    })
      .then(response => {
        const blob = new Blob([response.data], { type: 'image/webp' });
        const url = URL.createObjectURL(blob);

        // Once the full-resolution image is loaded, replace the thumbnail
        const img = new Image();
        img.src = url;
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

  // Set up Intersection Observer for lazy loading of thumbnails
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute('data-index');
          const id = entry.target.getAttribute('data-id');
          
          // Load thumbnail
          setThumbnailLoaded(prev => {
            const newLoaded = [...prev];
            newLoaded[index] = true; // Mark thumbnail as loaded
            return newLoaded;
          });

          // Check if all thumbnails are loaded
          if (thumbnailLoaded.every(Boolean)) {
            loadFullRes(id, index); // Load full-res if all thumbnails are loaded
          }

          observer.unobserve(entry.target); // Stop observing
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.1,
    });

    imageRefs.current.forEach((imgRef) => {
      if (imgRef) observer.observe(imgRef);
    });

    return () => {
      observer.disconnect();
    };
  }, [images, thumbnailLoaded]);

  return (
    <div>
      <h2>Uploaded Images</h2>
      <div className='grid'>
        {images.map((image, index) => (
          <div key={image._id} className='blur-load'>
            <img
              src={`http://localhost:5000/api/import/thumbnail/${image._id}`}
              alt="Thumbnail"
              ref={el => (imageRefs.current[index] = el)}
              data-id={image._id}
              data-index={index}
              style={{ display: fullResLoaded[index] ? 'none' : 'block' }}
              className='low-res'
            />
            {fullResLoaded[index] && (
              <img
                src={fullResLoaded[index]}
                alt="Full resolution"
                loading="lazy"
                className="high-res"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewImages;
