const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Store chat sessions (conversation history)
const chatSessions = new Map();

// Initialize chat session
app.post('/api/chat/init', async (req, res) => {
    try {
        const sessionId = Date.now().toString();
        
        // Initialize with system message
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, concise, and accurate responses.'
            }
        ];
        
        chatSessions.set(sessionId, messages);
        
        res.json({ 
            success: true, 
            sessionId,
            model: 'gpt-3.5-turbo',
            message: 'Chat session initialized'
        });
    } catch (error) {
        console.error('Error initializing chat:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to initialize chat session',
            details: error.message
        });
    }
});

// Send message and get response
app.post('/api/chat/message', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Get or create conversation history
        let messages = chatSessions.get(sessionId);
        
        if (!messages) {
            // Create new session if doesn't exist
            messages = [
                {
                    role: 'system',
                    content: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, concise, and accurate responses.'
                }
            ];
            chatSessions.set(sessionId, messages);
        }

        // Add user message to history
        messages.push({
            role: 'user',
            content: message
        });

        // Get response from OpenAI
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.9,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const assistantMessage = completion.choices[0].message.content;

        // Add assistant response to history
        messages.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Update session
        chatSessions.set(sessionId, messages);

        res.json({ 
            success: true, 
            response: assistantMessage,
            sessionId,
            model: completion.model,
            tokensUsed: completion.usage.total_tokens
        });

    } catch (error) {
        console.error('Error sending message:', error);
        
        // Handle specific OpenAI errors
        if (error.status === 401) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid API key. Please check your OpenAI API key.',
                details: error.message
            });
        }
        
        if (error.status === 429) {
            return res.status(429).json({ 
                success: false, 
                error: 'Rate limit exceeded. Please try again later.',
                details: error.message
            });
        }
        
        if (error.status === 500) {
            return res.status(500).json({ 
                success: false, 
                error: 'OpenAI server error. Please try again.',
                details: error.message
            });
        }

        res.status(500).json({ 
            success: false, 
            error: 'Failed to get response from AI',
            details: error.message 
        });
    }
});

// Clear chat session
app.post('/api/chat/clear', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (sessionId && chatSessions.has(sessionId)) {
            chatSessions.delete(sessionId);
        }
        
        res.json({ 
            success: true, 
            message: 'Chat session cleared' 
        });
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to clear chat session' 
        });
    }
});

// Get conversation history
app.get('/api/chat/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = chatSessions.get(sessionId);
        
        if (!messages) {
            return res.status(404).json({ 
                success: false, 
                error: 'Session not found' 
            });
        }
        
        res.json({ 
            success: true, 
            messages: messages.filter(m => m.role !== 'system') // Don't return system message
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch conversation history' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const apiKeySet = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    
    res.json({ 
        success: true, 
        message: 'Server is running',
        apiKeyConfigured: apiKeySet,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        timestamp: new Date().toISOString()
    });
});

// Test API key endpoint
app.get('/api/test', async (req, res) => {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
        });
        
        res.json({ 
            success: true, 
            message: 'API key is valid',
            response: completion.choices[0].message.content
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'API key test failed',
            details: error.message
        });
    }
});

// Clean up old sessions every hour
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId] of chatSessions.entries()) {
        if (parseInt(sessionId) < oneHourAgo) {
            chatSessions.delete(sessionId);
            console.log(`Cleaned up session: ${sessionId}`);
        }
    }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🤖 OpenAI ChatBot Server');
    console.log('='.repeat(50));
    console.log(`✅ Server running: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
    console.log(`📊 Model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
    
    const apiKeySet = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    if (!apiKeySet) {
        console.log('\n⚠️  WARNING: OpenAI API key not configured!');
        console.log('   Add your API key to .env file');
    } else {
        console.log('✅ API key configured');
    }
    console.log('='.repeat(50) + '\n');
});