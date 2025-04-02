const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config/config');

class VideoRepository {
  constructor() {
    this.recordedDir = config.paths.recordedDir;
    this.tempDir = config.paths.tempDir;
    
    // Create directories if they don't exist
    this.ensureDirectoriesExist();
  }

  ensureDirectoriesExist() {
    if (!fs.existsSync(this.recordedDir)) {
      fs.mkdirSync(this.recordedDir, { recursive: true });
    }

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Get all video files with their metadata
  getAllVideos() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.recordedDir, (err, files) => {
        if (err) {
          console.error('Error reading recorded directory:', err);
          return reject(err);
        }
        
        // Filter video files
        const videoFiles = files.filter(file => 
          file.endsWith('.mp4') || file.endsWith('.webm')
        );
        
        // Get file stats for each video
        const fileDetails = videoFiles.map(file => {
          const filePath = path.join(this.recordedDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            name: file,
            path: `/recordings/${file}`,
            size: stats.size,
            created: stats.birthtime
          };
        });
        
        // Sort by creation date (newest first)
        fileDetails.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        resolve(fileDetails);
      });
    });
  }

  // Convert WebM to MP4 with specified quality
  convertVideo(inputPath, quality) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const outputFilename = `screen_${now}_${quality}p.mp4`;
      const outputPath = path.join(this.recordedDir, outputFilename);
      
      // Define quality settings for different resolutions
      const qualitySettings = {
        '360': { resolution: '640x360', videoBitrate: '800k', audioBitrate: '96k' },
        '480': { resolution: '854x480', videoBitrate: '1500k', audioBitrate: '128k' },
        '720': { resolution: '1280x720', videoBitrate: '2500k', audioBitrate: '192k' },
        '1080': { resolution: '1920x1080', videoBitrate: '5000k', audioBitrate: '256k' },
        '1440': { resolution: '2560x1440', videoBitrate: '8000k', audioBitrate: '320k' },
        '4k': { resolution: '3840x2160', videoBitrate: '16000k', audioBitrate: '384k' }
      };
      
      // Use the requested quality settings or default to 720p if invalid
      const videoSettings = qualitySettings[quality] || qualitySettings['720'];

      console.log(`Converting video: ${inputPath}`);
      console.log(`Output: ${outputPath}`);
      console.log(`Using quality settings: ${quality}p - ${videoSettings.resolution}`);

      try {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(videoSettings.resolution)
          .videoBitrate(videoSettings.videoBitrate)
          .audioBitrate(videoSettings.audioBitrate)
          .output(outputPath)
          .on('start', () => {
            console.log('Started video conversion process');
          })
          .on('end', () => {
            console.log('Video conversion completed');
            console.log(`File saved to: ${outputPath}`);
            
            // Clean up the temp file
            this.deleteFile(inputPath);
            
            resolve({
              success: true,
              filename: outputFilename,
              path: `/recordings/${outputFilename}`,
              size: fs.statSync(outputPath).size,
              outputPath
            });
          })
          .on('error', (err) => {
            console.error('Error during video conversion:', err);
            
            // Clean up the temp file
            this.deleteFile(inputPath);
            
            reject(err);
          })
          .run();
      } catch (error) {
        console.error('Exception during FFmpeg setup:', error);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        reject(error);
      }
    });
  }

  // Save WebM file directly without conversion
  saveWebmFile(inputPath) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const outputFilename = `screen_${now}.webm`;
      const outputPath = path.join(this.recordedDir, outputFilename);
      
      console.log(`Saving WebM video: ${inputPath}`);
      console.log(`Output: ${outputPath}`);

      // Copy the file to the recorded directory
      const readStream = fs.createReadStream(inputPath);
      const writeStream = fs.createWriteStream(outputPath);
      
      readStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log('WebM file saved successfully');
        console.log(`File saved to: ${outputPath}`);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        resolve({
          success: true,
          filename: outputFilename,
          path: `/recordings/${outputFilename}`,
          size: fs.statSync(outputPath).size,
          outputPath
        });
      });
      
      writeStream.on('error', (err) => {
        console.error('Error saving WebM file:', err);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        reject(err);
      });
    });
  }
  
  // Helper method to delete a file
  deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
  
  // Get a specific video by filename
  getVideoStream(filename) {
    const filepath = path.join(this.recordedDir, filename);
    return { filepath };
  }
}

module.exports = new VideoRepository(); 