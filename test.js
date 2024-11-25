require('dotenv').config(); // Load API key from .env
const { Configuration, OpenAIApi } = require('openai');

// Check if API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Test OpenAI API
async function testOpenAI() {
  console.log('Testing OpenAI API...');
  
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-turbo', // Test with gpt-4-turbo; use gpt-3.5-turbo if necessary
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Test OpenAI API connection.' },
      ],
    });

    console.log('Response from OpenAI:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error during OpenAI API request:', error.response?.data || error.message);
  }
}

// Run the test
testOpenAI();
