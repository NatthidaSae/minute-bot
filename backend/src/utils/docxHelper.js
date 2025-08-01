const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const mammoth = require('mammoth');

/**
 * Helper functions for .docx file manipulation
 */

/**
 * Append summary text to a .docx file buffer
 * @param {Buffer} originalBuffer - The original .docx file buffer
 * @param {string} summaryText - The summary text to append
 * @returns {Promise<Buffer>} - Modified .docx file buffer
 */
async function appendSummaryToDocx(originalBuffer, summaryText) {
  try {
    // First, extract the original text content
    const extractResult = await mammoth.extractRawText({ buffer: originalBuffer });
    const originalText = extractResult.value;
    
    // Create a new document with original content + summary
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Original content as plain text
          new Paragraph({
            text: originalText,
            spacing: {
              after: 200
            }
          }),
          
          // Add a separator
          new Paragraph({
            text: "",
            spacing: {
              before: 400,
              after: 400
            }
          }),
          
          // Summary section header
          new Paragraph({
            text: "========================================",
            spacing: {
              after: 100
            }
          }),
          new Paragraph({
            text: `MEETING SUMMARY (Generated on ${new Date().toLocaleDateString()})`,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 100
            }
          }),
          new Paragraph({
            text: "========================================",
            spacing: {
              after: 300
            }
          }),
          
          // Summary content
          ...formatSummaryContent(summaryText)
        ]
      }]
    });
    
    // Convert document to buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
    
  } catch (error) {
    console.error('Error appending summary to .docx:', error);
    throw error;
  }
}

/**
 * Format summary text into paragraphs for .docx
 * @param {string} summaryText - The summary text
 * @returns {Array<Paragraph>} - Array of Paragraph objects
 */
function formatSummaryContent(summaryText) {
  const paragraphs = [];
  const lines = summaryText.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') {
      // Empty line for spacing
      paragraphs.push(new Paragraph({
        text: "",
        spacing: { after: 100 }
      }));
    } else if (line.startsWith('ATTENDEES') || 
               line.startsWith('KEY DECISIONS') || 
               line.startsWith('ACTION ITEMS') || 
               line.startsWith('DISCUSSION HIGHLIGHTS')) {
      // Section headers
      paragraphs.push(new Paragraph({
        text: line,
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100
        }
      }));
    } else if (line.startsWith('---') || line.startsWith('===')) {
      // Separators
      paragraphs.push(new Paragraph({
        text: line,
        spacing: { after: 100 }
      }));
    } else {
      // Regular content
      paragraphs.push(new Paragraph({
        text: line,
        spacing: { after: 50 }
      }));
    }
  }
  
  return paragraphs;
}

module.exports = {
  appendSummaryToDocx
};