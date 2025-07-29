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

}

// Create singleton instance
const documentParser = new DocumentParser();

module.exports = documentParser;