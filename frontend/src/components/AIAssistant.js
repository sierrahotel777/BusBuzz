import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { routeData } from './routeData';
import './AIAssistant.css';

// Helper to make responses more varied
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getAIResponse = (message, user, context) => {
    const lowerCaseMessage = message.toLowerCase();

    // Contextual follow-up for asking about a specific route
    if (context === 'ask_route_details') {
        const routeMatch = lowerCaseMessage.match(/([a-z0-9:]+)/);
        if (routeMatch && routeData[routeMatch[1].toUpperCase()]) {
            const routeKey = routeMatch[1].toUpperCase();
            const stops = Object.keys(routeData[routeKey].stops);
            const firstStop = stops[0];
            const firstStopTime = routeData[routeKey].stops[firstStop];
            return {
                text: `Route ${routeKey} has ${stops.length} stops, including: ${stops.slice(0, 3).join(', ')}... The first stop, ${firstStop}, is at ${firstStopTime}.`,
                context: null, // End of this conversation path
            };
        }
        return { text: "Sorry, I couldn't find that route. Please provide a valid route number (e.g., S1)." };
    }

    // Greetings
    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
        const greetings = [`Hello, ${user.name}!`, `Hi there, ${user.name}!`, `Hey, ${user.name}!`];
        return { text: `${randomChoice(greetings)} How can I help you with your transport needs today?` };
    }

    // Specific route info
    const routeMatch = lowerCaseMessage.match(/route\s*([a-z0-9:]+)/);
    if (routeMatch && routeData[routeMatch[1].toUpperCase()]) {
        const routeKey = routeMatch[1].toUpperCase();
        const stops = Object.keys(routeData[routeKey].stops);
        const firstStop = stops[0];
        const firstStopTime = routeData[routeKey].stops[firstStop];
        return { text: `Route ${routeKey} has ${stops.length} stops, including: ${stops.slice(0, 3).join(', ')}... The first stop, ${firstStop}, is at ${firstStopTime}.` };
    }

    // Follow-up question if the user just says "route"
    if (lowerCaseMessage.includes('route')) {
        return {
            text: "Which route are you interested in? You can tell me the route number.",
            context: 'ask_route_details',
        };
    }

    // User's route info
    if (lowerCaseMessage.includes('my route') || lowerCaseMessage.includes('my bus')) {
        if (user.busRoute) {
            const stops = Object.keys(routeData[user.busRoute].stops).join(', ');
            return { text: `You're on route ${user.busRoute}. The stops are: ${stops}.` };
        }
        return { text: 'It looks like you don\'t have a bus route assigned yet. You can set one in your profile to get personalized info!' };
    }

    // Timings
    if (lowerCaseMessage.includes('time') || lowerCaseMessage.includes('timing')) {
        if (user.busRoute && user.favoriteStop) {
            const eta = routeData[user.busRoute].stops[user.favoriteStop];
            return { text: `Of course! The estimated arrival for your bus at your favorite stop, "${user.favoriteStop}", is ${eta}.` };
        }
        return { text: 'I can give you specific timings if you set your bus route and favorite stop in your profile.' };
    }

    // Feedback
    if (lowerCaseMessage.includes('feedback') || lowerCaseMessage.includes('report')) {
        return {
            text: 'You can submit feedback or report an issue on the "Submit Feedback" page. I can take you there if you like.',
            suggestions: ['Go to Feedback', 'Stay here'],
            actionLink: { to: '/feedback', label: 'Go to Feedback' }
        };
    }

    // Lost and Found
    if (lowerCaseMessage.includes('lost') || lowerCaseMessage.includes('found')) {
        return {
            text: 'For any lost or found items, the "Lost & Found" page is the best place to check. Would you like to go now?',
            suggestions: ['Go to Lost & Found', 'Stay here'],
            actionLink: { to: '/lost-and-found', label: 'Go to Lost & Found' }
        };
    }

    // Default fallback
    const fallbacks = [
        "I'm sorry, I'm not sure how to help with that.",
        "I don't have information on that topic yet.",
        "Could you please rephrase that?"
    ];
    return { text: `${randomChoice(fallbacks)} You can ask me about bus routes, timings, or how to submit feedback.` };
};

function AIAssistant({ isOpen, onClose, user }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quickReplies, setQuickReplies] = useState([]);
    const [conversationContext, setConversationContext] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([{
                sender: 'ai',
                text: `Hi ${user.name}! I'm your BusBuzz assistant. Feel free to ask me about bus timings, routes, or how to report feedback.`
            }]);
            setQuickReplies([]);
            setConversationContext(null);
        }
    }, [isOpen, user.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e, messageText) => {
        if (e) e.preventDefault();
        const message = messageText || inputValue;
        if (!message.trim()) return;

        const userMessage = { sender: 'user', text: message };
        setMessages(prev => [...prev, userMessage]);
        setQuickReplies([]); // Clear quick replies after user sends a message
        setIsTyping(true);

        const aiResponse = getAIResponse(message, user, conversationContext);
        
        setTimeout(() => {
            const aiMessage = {
                sender: 'ai',
                text: aiResponse.text,
                actionLink: aiResponse.actionLink
            };
            setMessages(prev => [...prev, aiMessage]);
            setQuickReplies(aiResponse.suggestions || []);
            setConversationContext(aiResponse.context || null);
            setIsTyping(false);
        }, 600); // Simulate thinking

        setInputValue(''); // Clear input field
    };

    if (!isOpen) return null;

    return (
        <div className="ai-assistant-container">
            <div className="ai-header">
                <h3>BusBuzz AI Assistant</h3>
                <button onClick={onClose} className="ai-close-btn">✖</button>
            </div>
            <div className="ai-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender}`}>
                        {msg.text}
                        {/* Render action link if it exists and matches the message */}
                        {msg.actionLink && msg.text.includes(msg.actionLink.label) && <Link to={msg.actionLink.to} onClick={onClose} className="ai-link-button">{msg.actionLink.label}</Link>}
                    </div>
                ))}
                {isTyping && (
                    <div className="message-bubble ai typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {quickReplies.length > 0 && (
                <div className="ai-quick-replies">
                    {quickReplies.map((reply, index) => (
                        <button key={index} onClick={(e) => handleSendMessage(e, reply)}>{reply}</button>
                    ))}
                </div>
            )}
            <form className="ai-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default AIAssistant;