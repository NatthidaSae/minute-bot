const mammoth = require('mammoth');

/**
 * Document parser service for extracting text from various file formats
 */
class DocumentParser {
  /**
   * Parse a .docx file buffer and extract text content
   * @param {Buffer} buffer - The file buffer
   * @returns {Promise<string>} - Extracted text content
   */
  async parseDocx(buffer) {
    try {
      console.log('Parsing .docx file...');
      
      // Extract raw text from the document
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth parsing messages:', result.messages);
      }
      
      const text = result.value;
      
      // Clean up the text (remove excessive whitespace)
      const cleanedText = text
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
        .trim();
      
      console.log(`Extracted ${cleanedText.length} characters from .docx file`);
      
      return cleanedText;
    } catch (error) {
      console.error('Error parsing .docx file:', error);
      throw new Error(`Failed to parse .docx file: ${error.message}`);
    }
  }

  /**
   * Parse document based on MIME type
   * @param {Buffer} buffer - The file buffer
   * @param {string} mimeType - The file MIME type
   * @returns {Promise<string>} - Extracted text content
   */
  async parseDocument(buffer, mimeType) {
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.parseDocx(buffer);
      
      // Future support for other formats
      // case 'application/pdf':
      //   return this.parsePdf(buffer);
      // case 'application/rtf':
      //   return this.parseRtf(buffer);
      
      default:
        // For text files, just convert buffer to string
        if (mimeType.startsWith('text/')) {
          return buffer.toString('utf-8');
        }
        throw new Error(`Unsupported document type: ${mimeType}`);
    }
  }

  /**
   * Check if a MIME type is supported for parsing
   * @param {string} mimeType - The file MIME type
   * @returns {boolean} - True if supported
   */
  isSupported(mimeType) {
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain',
      'text/markdown',
      'text/csv'
    ];
    
    return supportedTypes.includes(mimeType) || mimeType.startsWith('text/');
  }
}

// Create singleton instance
const documentParser = new DocumentParser();

module.exports = documentParser;