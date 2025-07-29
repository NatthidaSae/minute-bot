#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { generateSummary } = require('../services/openaiService');

// Sample transcript for testing
const sampleTranscript = `
Alice: Welcome everyone to today's product meeting. I'm glad we could all make it.

Bob: Thanks for joining, Alice. Let's discuss the new feature rollout for our application.

Alice: Absolutely. The main agenda today is to decide on the launch date for version 2.0 and assign responsibilities.

Charlie: I've been reviewing the development progress, and I think we're almost ready. I suggest we launch on March 15th after we complete the final testing phase.

Bob: That sounds reasonable. Charlie, can you handle the testing phase? We need comprehensive testing across all modules.

Charlie: Yes, I'll take ownership of that. I'll complete all testing by March 10th, giving us a 5-day buffer before launch.

Alice: Perfect. We also need to prepare marketing materials for the launch. This includes updating the website, creating announcement emails, and social media posts.

Bob: I'll assign that to the marketing team. Sarah from marketing can lead that effort.

David: Should we also plan a webinar to showcase the new features to our existing customers?

Alice: Great idea, David. Let's schedule that for March 20th, a few days after the launch.

Bob: I'll coordinate with the customer success team for the webinar.

Alice: Excellent. So our next steps are: Charlie completes testing by March 10th, marketing team prepares materials, and we launch on March 15th with a follow-up webinar on March 20th.

Everyone: Agreed!

Alice: Thanks everyone. Let's reconvene next week to check progress.
`;

async function testOpenRouterConnection() {
  console.log('🔍 Testing OpenRouter.ai Connection...\n');
  
  // Check if API key is set
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ ERROR: OPENROUTER_API_KEY is not set in environment variables');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', process.env.OPENROUTER_API_KEY.substring(0, 20) + '...');
  console.log('📡 API URL: https://openrouter.ai/api/v1/chat/completions');
  console.log('🤖 Model: openai/gpt-3.5-turbo\n');
  
  try {
    console.log('📝 Sending sample transcript for summarization...\n');
    const startTime = Date.now();
    
    // Call the generateSummary function
    const summary = await generateSummary(sampleTranscript);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('✅ SUCCESS! Summary generated in', duration.toFixed(2), 'seconds\n');
    console.log('📊 Generated Summary:');
    console.log('===================');
    
    // Display summary in a formatted way
    console.log('\n👥 Attendees:', summary.attendees.length);
    summary.attendees.forEach(attendee => console.log(`   - ${attendee}`));
    
    console.log('\n🎯 Key Decisions:', summary.key_decisions.length);
    summary.key_decisions.forEach((decision, i) => console.log(`   ${i + 1}. ${decision}`));
    
    console.log('\n📋 Action Items:', summary.action_items.length);
    summary.action_items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.task}`);
      if (item.assignedTo.length > 0) {
        console.log(`      Assigned to: ${item.assignedTo.join(', ')}`);
      }
      if (item.dueDate) {
        console.log(`      Due: ${item.dueDate}`);
      }
    });
    
    console.log('\n💡 Discussion Highlights:', summary.discussion_highlights.length);
    summary.discussion_highlights.forEach((highlight, i) => console.log(`   ${i + 1}. ${highlight}`));
    
    console.log('\n➡️ Next Steps:', summary.next_steps.length);
    summary.next_steps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));
    
    console.log('\n✅ OpenRouter.ai connection test PASSED!');
    console.log('The service is working correctly and generating proper summaries.\n');
    
    // Also display raw JSON for debugging
    console.log('📄 Raw JSON Response:');
    console.log(JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to generate summary');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('\n🔍 API Response Error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Verify your OPENROUTER_API_KEY is correct');
    console.error('2. Check if you have credits in your OpenRouter account');
    console.error('3. Ensure your API key has the correct permissions');
    console.error('4. Check your internet connection');
    console.error('5. Visit https://openrouter.ai/keys to manage your API keys');
    
    process.exit(1);
  }
}

// Run the test
console.log('🚀 OpenRouter.ai Connection Test\n');
console.log('This script will test the connection to OpenRouter.ai');
console.log('and verify that summary generation is working properly.\n');

testOpenRouterConnection();