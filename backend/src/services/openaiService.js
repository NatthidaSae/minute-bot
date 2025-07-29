const axios = require('axios');

// OpenRouter.ai configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Default model - can be changed based on requirements
const DEFAULT_MODEL = 'openai/gpt-3.5-turbo';

/**
 * Generates a structured summary from a meeting transcript using OpenRouter.ai
 * @param {string} transcript - The meeting transcript text
 * @returns {Promise<Object>} - Structured summary object
 */
async function generateSummary(transcript) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const prompt = `
คุณคือผู้ช่วย AI ที่สร้างสรุปโครงสร้างจากการถอดเสียงการประชุม
วิเคราะห์การถอดเสียงการประชุมต่อไปนี้และสรุปในรูปแบบ JSON

การสรุปควรประกอบด้วย:
1.  key_decisions: อาร์เรย์ของการตัดสินใจที่สำคัญที่เกิดขึ้นในการประชุม ควรค้นหาจากวลีที่แสดงถึงการตกลงร่วมกันอย่างชัดเจน เช่น "เราตัดสินใจว่า", "ตกลงกันว่า", "เห็นชอบ", "อนุมัติ", "เลือกที่จะ", "ข้อสรุปสุดท้ายคือ", "เราจะดำเนินการด้วย".
2.  action_items: อาร์เรย์ของงานที่เฉพาะเจาะจงซึ่งได้รับการมอบหมายโดยตรงจากการประชุม รวมถึงผู้รับผิดชอบและวันครบกำหนดหากมีการกล่าวถึง นี่คืองานเร่งด่วนที่มีผู้รับผิดชอบชัดเจน
3.  discussion_highlights: อาร์เรย์ของหัวข้อหลักที่ถูกสนทนาหรือประเด็นสำคัญที่ถูกยกขึ้นมาระหว่างการสนทนา
4.  attendees: อาร์เรย์ของชื่อผู้เข้าร่วมที่กล่าวถึงในการถอดเสียง (ดึงข้อมูลจากการสนทนา)

action_item แต่ละรายการควรเป็นออบเจกต์ที่มีฟิลด์เหล่านี้:
-   task: string (คำอธิบายของงานเฉพาะ)
-   assignedTo: array of strings (ชื่อของผู้ที่ได้รับมอบหมาย)
-   dueDate: string หรือ null (วันครบกำหนด หากมีการกล่าวถึง มิฉะนั้นจะเป็น null)

Transcript:
${transcript}

ตอบกลับเฉพาะ JSON ที่ถูกต้องเท่านั้น ห้ามมีข้อความหรือคำอธิบายเพิ่มเติม
`;

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes meeting transcripts into structured JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Meeting Summary Bot'
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const content = response.data.choices[0].message.content;
    
    // Parse the JSON response
    let summary;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/g, '').trim();
      }
      
      summary = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      throw new Error('Failed to parse summary from LLM response');
    }

    // Validate and normalize the summary structure
    const normalizedSummary = {
      key_decisions: Array.isArray(summary.key_decisions) ? summary.key_decisions : [],
      action_items: Array.isArray(summary.action_items) ? summary.action_items.map(item => ({
        task: item.task || '',
        assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : [],
        dueDate: item.dueDate || null
      })) : [],
      discussion_highlights: Array.isArray(summary.discussion_highlights) ? summary.discussion_highlights : [],
      attendees: Array.isArray(summary.attendees) ? summary.attendees : []
    };

    return normalizedSummary;

  } catch (error) {
    if (error.response) {
      // API error response
      console.error('OpenRouter API Error:', error.response.data);
      throw new Error(`LLM API Error: ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      // Request made but no response
      console.error('No response from OpenRouter API');
      throw new Error('No response from LLM service');
    } else {
      // Other errors
      console.error('Error generating summary:', error.message);
      throw error;
    }
  }
}

/**
 * Retries summary generation with exponential backoff
 * @param {string} transcript - The meeting transcript text
 * @param {number} maxRetries - Maximum number of retries (default: 1)
 * @returns {Promise<Object>} - Structured summary object
 */
async function generateSummaryWithRetry(transcript, maxRetries = 1) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateSummary(transcript);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt * 1000ms
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying summary generation after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  generateSummaryWithRetry
};