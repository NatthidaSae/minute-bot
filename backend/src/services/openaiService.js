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
You are an AI assistant that creates structured summaries from meeting transcripts.
Analyze the following meeting transcript and provide a summary in JSON format.

The summary should include:
1.  key_decisions: Array of important decisions explicitly made or clearly agreed upon during the meeting. Look for phrases like "we decided," "it's agreed that," "the consensus is," "approved," "opted for," "the final call is to," "we will proceed with."
2.  action_items: Array of specific, assignable tasks resulting directly from the meeting, including who is responsible and due dates if mentioned. These are immediate tasks with clear ownership.
3.  discussion_highlights: Array of main topics discussed or important points raised during the conversation.
4.  next_steps: Array of planned future activities, broader follow-up items, or topics for subsequent discussions that do not have immediate individual assignments or strict deadlines from this specific meeting. These represent the general progression or future agenda.
5.  attendees: Array of participant names mentioned in the transcript (extract from the conversation).

Each action_item should be an object with these fields:
-   task: string (description of the specific task)
-   assignedTo: array of strings (names of people assigned)
-   dueDate: string or null (due date if mentioned, otherwise null)

Transcript:
${transcript}

Respond ONLY with valid JSON, no additional text or explanation.
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
        temperature: 0.2, 
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
      next_steps: Array.isArray(summary.next_steps) ? summary.next_steps : [],
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
  generateSummary,
  generateSummaryWithRetry
};