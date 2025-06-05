import React from 'react';

interface ChatbotContainerProps {
  src: string;
  title?: string;
}

const ChatbotContainer: React.FC<ChatbotContainerProps> = ({ src, title = 'Chatbot' }) => {
  return (
    <div className="chatbot-container w-full h-full flex-1 flex flex-col border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <iframe
        src={src}
        className="w-full h-full flex-1"
        style={{ minHeight: '700px' }}
        frameBorder="0"
        allow="microphone"
        title={title}
      />
      <style jsx>{`
        @media (max-width: 768px) {
          .chatbot-container {
            min-height: 500px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotContainer;
