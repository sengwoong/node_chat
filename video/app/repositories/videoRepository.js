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
  
  // Get user-specific directory and ensure it exists
  getUserDir(userId) {
    const userDir = path.join(this.recordedDir, userId);
    if (!fs.existsSync(userDir)) {
      console.log(`Creating user directory: ${userDir}`);
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  // Get all video files with their metadata
  getAllVideos(userId = 'default') {
    return new Promise((resolve, reject) => {
      const userDir = this.getUserDir(userId);
      console.log(`[getAllVideos] Looking for videos in: ${userDir}`);
      
      fs.readdir(userDir, (err, files) => {
        if (err) {
          console.error(`Error reading user directory for ${userId}:`, err);
          return reject(err);
        }
        
        // Filter video files
        const videoFiles = files.filter(file => 
          file.endsWith('.mp4') || file.endsWith('.webm')
        );
        
        console.log(`[getAllVideos] Found ${videoFiles.length} video files for user ${userId}`);
        
        // Get file stats for each video
        const fileDetails = videoFiles.map(file => {
          const filePath = path.join(userDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            name: file,
            path: `/${userId}/recordings/${file}`,
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
  convertVideo(inputPath, quality, userId = 'default') {
    return new Promise((resolve, reject) => {
      const userDir = this.getUserDir(userId);
      const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const outputFilename = `screen_${now}_${quality}p.mp4`;
      const outputPath = path.join(userDir, outputFilename);
      
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

      console.log(`[convertVideo] Converting video for user ${userId}: ${inputPath}`);
      console.log(`[convertVideo] Output: ${outputPath}`);
      console.log(`[convertVideo] Using quality settings: ${quality}p - ${videoSettings.resolution}`);

      try {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
          console.error(`[convertVideo] Input file does not exist: ${inputPath}`);
          return reject(new Error('Input file does not exist'));
        }

        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(videoSettings.resolution)
          .videoBitrate(videoSettings.videoBitrate)
          .audioBitrate(videoSettings.audioBitrate)
          .output(outputPath)
          .on('start', () => {
            console.log('[convertVideo] Started video conversion process');
          })
          .on('end', () => {
            console.log('[convertVideo] Video conversion completed');
            console.log(`[convertVideo] File saved to: ${outputPath}`);
            
            // Clean up the temp file
            this.deleteFile(inputPath);
            
            resolve({
              success: true,
              filename: outputFilename,
              path: `/${userId}/recordings/${outputFilename}`,
              size: fs.statSync(outputPath).size,
              outputPath
            });
          })
          .on('error', (err) => {
            console.error('[convertVideo] Error during video conversion:', err);
            
            // Clean up the temp file
            this.deleteFile(inputPath);
            
            reject(err);
          })
          .run();
      } catch (error) {
        console.error('[convertVideo] Exception during FFmpeg setup:', error);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        reject(error);
      }
    });
  }

  // Save WebM file directly without conversion
  saveWebmFile(inputPath, userId = 'default') {
    return new Promise((resolve, reject) => {
      const userDir = this.getUserDir(userId);
      const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const outputFilename = `screen_${now}.webm`;
      const outputPath = path.join(userDir, outputFilename);
      
      console.log(`[saveWebmFile] Saving WebM video for user ${userId}: ${inputPath}`);
      console.log(`[saveWebmFile] Output: ${outputPath}`);

      // Check if input file exists
      if (!fs.existsSync(inputPath)) {
        console.error(`[saveWebmFile] Input file does not exist: ${inputPath}`);
        return reject(new Error('Input file does not exist'));
      }

      // Copy the file to the user's directory
      const readStream = fs.createReadStream(inputPath);
      const writeStream = fs.createWriteStream(outputPath);
      
      readStream.pipe(writeStream);
      
      readStream.on('error', (err) => {
        console.error('[saveWebmFile] Error reading input file:', err);
        reject(err);
      });
      
      writeStream.on('finish', () => {
        console.log('[saveWebmFile] WebM file saved successfully');
        console.log(`[saveWebmFile] File saved to: ${outputPath}`);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        resolve({
          success: true,
          filename: outputFilename,
          path: `/${userId}/recordings/${outputFilename}`,
          size: fs.statSync(outputPath).size,
          outputPath
        });
      });
      
      writeStream.on('error', (err) => {
        console.error('[saveWebmFile] Error saving WebM file:', err);
        
        // Clean up the temp file
        this.deleteFile(inputPath);
        
        reject(err);
      });
    });
  }
  
  // Helper method to delete a file
  deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      } else {
        console.log(`Successfully deleted temp file: ${filePath}`);
      }
    });
  }
  
  // Get a specific video by filename for a user
  getVideoStream(filename, userId = 'default') {
    const userDir = this.getUserDir(userId);
    const filepath = path.join(userDir, filename);
    console.log(`[getVideoStream] Streaming file: ${filepath} for user ${userId}`);
    return { filepath };
  }
}

module.exports = VideoRepository; 