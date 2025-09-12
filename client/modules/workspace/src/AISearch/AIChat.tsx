import React, { useState, useEffect } from 'react';
import { Bubble, Sender } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Layout, Flex } from 'antd';
import useWebSocket from 'react-use-websocket';
import parse from 'html-react-parser';
import markdownit from 'markdown-it';

const { Content, Footer } = Layout;

const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
});

// Markdown rendering function using markdown-it
const renderMarkdown = (content: string) => {
  if (typeof content !== 'string') return content;

  const html = md.render(content);
  return parse(html);
};

interface Message {
  key: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  typing?: boolean | { step?: number; interval?: number };
}

interface AIChatProps {
  closed?: boolean;
}

interface WSMessage {
  type: string;
  payload: string;
  key: string;
}

export const AIChat: React.FC<AIChatProps> = ({ closed }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      key: 'welcome',
      content:
        'Hello! I can help you search and understand publications. What would you like to know?',
      role: 'assistant',
      timestamp: Date.now(),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (closed) {
      setMessages([]);
      setLoading(false);
      setInputValue('');
    } else {
      setMessages([
        {
          key: 'welcome',
          content:
            'Hello! I can help you search and understand publications and documentation. What would you like to know?',
          role: 'assistant',
          timestamp: Date.now(),
        },
      ]);
      setLoading(false);
      setInputValue('');
    }
  }, [closed]);

  // WebSocket connection
  const socket = useWebSocket(
    `wss://${window.location.host}/ws/publications/`,
    {
      onOpen: () => {
        // WebSocket connected
      },
      onClose: () => {
        // WebSocket disconnected
      },
      onError: (event) => {
        setLoading(false); // Stop loading on error
      },
      shouldReconnect: (closeEvent) => true,
    }
  );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (socket.lastJsonMessage) {
      const wsMessage = socket.lastJsonMessage as WSMessage;
      console.log(wsMessage);
      if (wsMessage?.type === 'chat.response' && wsMessage?.payload) {
        const aiResponse: Message = {
          key: wsMessage.key,
          content: wsMessage.payload,
          role: 'assistant',
          timestamp: Date.now(),
          typing: { step: 6, interval: 25 },
        };
        setMessages((prev) => {
          if (prev.find((m) => m.key === aiResponse.key)) {
            return prev.map((msg) =>
              msg.key === aiResponse.key ? aiResponse : msg
            );
          } else {
            return [...prev, aiResponse];
          }
        });
        setLoading(false);
      } else if (wsMessage?.type === 'chat.status') {
        const aiResponse: Message = {
          key: `chat-${Date.now()}`,
          content: wsMessage.payload,
          role: 'assistant',
          timestamp: Date.now(),
          typing: { step: 6, interval: 25 },
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else if (wsMessage?.type === 'chat.error') {
        const aiResponse: Message = {
          key: wsMessage.key,
          content: wsMessage.payload,
          role: 'assistant',
          timestamp: Date.now(),
          typing: { step: 6, interval: 25 },
        };
        setMessages((prev) => [...prev, aiResponse]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [socket.lastJsonMessage]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    const messageKey = `chat-${Date.now()}`;
    const userMessage: Message = {
      key: messageKey,
      content: content,
      role: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInputValue('');

    if (socket.readyState === WebSocket.OPEN) {
      socket.sendJsonMessage({
        type: 'query',
        key: userMessage.key,
        payload: content,
      });
    } else {
      setLoading(false);

      const errorMessage: Message = {
        key: `error-${Date.now()}`,
        content:
          'Connection error. Please check your connection and try again.',
        role: 'assistant',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Convert messages to Bubble.List format
  const bubbleItems = messages.map((message) => ({
    key: message.key,
    content: message.content,
    placement: (message.role === 'user' ? 'end' : 'start') as 'end' | 'start',
    avatar:
      message.role === 'user'
        ? { icon: <UserOutlined /> }
        : { icon: <RobotOutlined /> },
    messageRender: renderMarkdown,
    typing: message.typing,
  }));

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ flex: 1, padding: '16px' }}>
        <Flex vertical style={{ height: '100%' }}>
          <Bubble.List
            items={bubbleItems}
            style={{ background: 'transparent', width: '100%' }}
          />
          {loading && (
            <Bubble
              content=""
              placement="start"
              avatar={{ icon: <RobotOutlined /> }}
              loading={true}
              style={{ marginTop: '8px' }}
            />
          )}
        </Flex>
      </Content>

      <Footer
        style={{
          padding: '16px',
          background: '#fff',
          borderTop: '1px solid #e6e6e6',
        }}
      >
        <Sender
          onSubmit={handleSendMessage}
          placeholder="Ask me anything about publications and documentation..."
          loading={loading}
          disabled={loading}
          value={inputValue}
          onChange={setInputValue}
        />
      </Footer>
    </Layout>
  );
};
