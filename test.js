const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 OpenAI API Key Test');
    console.log('='.repeat(60) + '\n');

    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if API key is set
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.error('❌ Error: OPENAI_API_KEY not found in .env file\n');
        console.log('To fix this:');
        console.log('1. Get your API key from: https://platform.openai.com/api-keys');
        console.log('2. Add it to .env file: OPENAI_API_KEY=sk-...');
        console.log('3. Run this test again\n');
        return;
    }
    
    console.log('✅ API Key found (first 10 chars):', apiKey.substring(0, 10) + '...\n');
    
    const openai = new OpenAI({ apiKey });
    
    try {
        console.log('📡 Testing connection to OpenAI...\n');
        
        // Test with a simple message
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'Say "Hello! The API is working correctly!"' }
            ],
            max_tokens: 50,
        });
        
        const response = completion.choices[0].message.content;
        
        console.log('✅ SUCCESS! API is working!\n');
        console.log('Model:', completion.model);
        console.log('Response:', response);
        console.log('Tokens used:', completion.usage.total_tokens);
        console.log('\n' + '='.repeat(60));
        console.log('🎉 Your OpenAI setup is complete and working!');
        console.log('='.repeat(60) + '\n');
        console.log('Next steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Open http://localhost:3000 in your browser');
        console.log('3. Start chatting!\n');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message, '\n');
        
        if (error.status === 401) {
            console.log('Problem: Invalid API key\n');
            console.log('Solution:');
            console.log('1. Go to: https://platform.openai.com/api-keys');
            console.log('2. Generate a new API key');
            console.log('3. Update your .env file');
            console.log('4. Make sure the key starts with "sk-"\n');
        } else if (error.status === 429) {
            console.log('Problem: Rate limit exceeded or quota reached\n');
            console.log('Solution:');
            console.log('1. Check your OpenAI usage: https://platform.openai.com/usage');
            console.log('2. Wait a few minutes and try again');
            console.log('3. If needed, add billing: https://platform.openai.com/billing\n');
        } else if (error.status === 500) {
            console.log('Problem: OpenAI server error\n');
            console.log('Solution:');
            console.log('1. Wait a few minutes');
            console.log('2. Check OpenAI status: https://status.openai.com/');
            console.log('3. Try again\n');
        } else if (error.code === 'ENOTFOUND') {
            console.log('Problem: Network connection error\n');
            console.log('Solution:');
            console.log('1. Check your internet connection');
            console.log('2. Check if you\'re behind a firewall/proxy');
            console.log('3. Try again\n');
        } else {
            console.log('Unexpected error. Details:\n');
            console.log(error);
            console.log('\n');
        }
        
        console.log('='.repeat(60) + '\n');
    }
}

testOpenAI();