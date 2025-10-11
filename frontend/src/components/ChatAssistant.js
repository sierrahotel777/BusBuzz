import React, { useState, useEffect, useRef } from 'react';
import { routeData } from './routeData'; 
import './ChatAssistant.css';
import { getAiResponse } from '../services/genAiApi';

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getInitialMessage = () => ({
    sender: 'ai',
    ...getAiResponse('hello') 
  });

  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && messages.length === 0) {
      setMessages([getInitialMessage()]);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const userMessage = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);

    const aiResponse = getAiResponse(query);
    const aiMessage = {
      sender: 'ai',
      text: typeof aiResponse === 'string' ? aiResponse : aiResponse.text,
      options: typeof aiResponse === 'object' ? aiResponse.options : []
    };

    setTimeout(() => {
      setMessages(prev => [...prev, aiMessage]);
    }, 500);

    setInputValue('');
  };

  const handleOptionClick = (option) => {
    const { type, routeId, stopName } = option.value;

    const userMessage = { sender: 'user', text: option.label };

    let aiMessage;
    if (type === 'select_route') {
      const stops = routeData[routeId]?.stops || {};
      const stopOptions = Object.keys(stops).map(stop => ({
        label: stop,
        value: { type: 'select_stop', routeId, stopName: stop }
      }));

      aiMessage = {
        sender: 'ai',
        text: `Great! Which stop on route ${routeId} are you interested in?`,
        options: stopOptions
      };
      setMessages(prev => [...prev, aiMessage]);
    } else if (type === 'select_stop') {
      const timing = routeData[routeId]?.stops[stopName] || 'Not available';
      aiMessage = {
        sender: 'ai',
        text: `The estimated arrival time for "${stopName}" on route ${routeId} is ${timing}.`,
        options: [{
          label: 'Start Over',
          value: { type: 'start_over' }
        }]
      };
    } else if (type === 'start_over') {
      aiMessage = getInitialMessage();
    }

    setMessages(prev => [...prev, userMessage]);
    if (aiMessage) {
      setTimeout(() => setMessages(prev => [...prev, aiMessage]), 500);
    }
  };

  const renderOptions = (options) => {
    if (!options || options.length === 0) return null;
    return (
      <div className="options-container">
        {options.map((option, index) => (
          <button key={index} className="option-button" onClick={() => handleOptionClick(option)}>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <button className="chat-toggle-button" onClick={toggleChat}>
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>BusBuzz Assistant</h3>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                <div className={`message ${msg.sender}`}>
                  {msg.text}
                </div>
                {msg.sender === 'ai' && renderOptions(msg.options)}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" disabled={!inputValue.trim()}><SendIcon /></button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;