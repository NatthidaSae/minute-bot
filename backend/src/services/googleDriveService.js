const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
  }

  /**
   * Initialize Google Drive API client with service account
   */
  async initialize() {
    try {
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
      
      if (!serviceAccountPath) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_PATH environment variable is not set');
      }

      // Read service account credentials
      const credentials = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));

      // Create auth client
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      // Create Drive client
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  /**
   * List files in a Google Drive folder
   * @param {string} folderId - The Google Drive folder ID
   * @returns {Promise<Array>} - Array of file metadata
   */
  async listFiles(folderId) {
    try {
      // First, list all files in the folder for debugging
      const allFilesResponse = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, mimeType)',
        pageSize: 100
      });
      
      console.log(`Total files in folder: ${allFilesResponse.data.files?.length || 0}`);
      if (allFilesResponse.data.files && allFilesResponse.data.files.length > 0) {
        console.log('All files found:');
        allFilesResponse.data.files.forEach(file => {
          console.log(`  - ${file.name} (${file.mimeType})`);
        });
      }

      // Now get .txt files, .docx files, and Google Docs
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and ((name contains '.txt' and not name contains '.summary.txt') OR (name contains '.docx' and not name contains '.summary.txt') OR mimeType='application/vnd.google-apps.document') and trashed=false`,
        fields: 'files(id, name, size, createdTime, modifiedTime, md5Checksum, mimeType)',
        orderBy: 'createdTime desc',
        pageSize: 100
      });

      const processableFiles = response.data.files || [];
      console.log(`Found ${processableFiles.length} processable files (.txt, .docx, and Google Docs)`);
      
      return processableFiles;
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Download file content from Google Drive
   * @param {string} fileId - The Google Drive file ID
   * @returns {Promise<string|Buffer>} - File content as string or Buffer
   */
  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Export Google Docs file as text
   * @param {string} fileId - The Google Docs file ID
   * @returns {Promise<string>} - Document content as plain text
   */
  async exportGoogleDoc(fileId) {
    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting Google Doc:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - The Google Drive file ID
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, size, createdTime, modifiedTime, md5Checksum, parents'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive
   * @param {string} fileName - The name of the file
   * @param {string} content - The file content
   * @param {string} folderId - The parent folder ID
   * @returns {Promise<Object>} - Uploaded file metadata
   */
  async uploadFile(fileName, content, folderId) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'text/plain',
        body: content
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name'
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Generate SHA256 hash from file content (for compatibility with existing code)
   * @param {string} content - File content
   * @returns {string} - SHA256 hash
   */
  generateFileHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if a file exists in Google Drive by name
   * @param {string} fileName - The file name to check
   * @param {string} folderId - The folder ID to search in
   * @returns {Promise<boolean>} - True if file exists
   */
  async fileExists(fileName, folderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: 'files(id)',
        pageSize: 1
      });

      return response.data.files && response.data.files.length > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

module.exports = googleDriveService;