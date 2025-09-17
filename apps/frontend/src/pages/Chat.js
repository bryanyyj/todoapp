import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Send, Plus, MessageCircle } from 'lucide-react';

export default function Chat() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery('chat-sessions', () =>
    axios.get('/api/chat/sessions').then(res => res.data)
  );

  const { data: messages } = useQuery(
    ['chat-messages', currentSessionId],
    () => currentSessionId ? 
      axios.get(`/api/chat/sessions/${currentSessionId}/messages`).then(res => res.data) : 
      Promise.resolve([]),
    { enabled: !!currentSessionId }
  );

  const createSessionMutation = useMutation(
    (title) => axios.post('/api/chat/sessions', { title }),
    {
      onSuccess: (response) => {
        const newSession = response.data;
        setCurrentSessionId(newSession.id);
        queryClient.invalidateQueries('chat-sessions');
      }
    }
  );

  const sendMessageMutation = useMutation(
    ({ sessionId, message }) => axios.post(`/api/chat/sessions/${sessionId}/messages`, { message }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', currentSessionId]);
        queryClient.invalidateQueries('chat-sessions');
      }
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateSession = () => {
    createSessionMutation.mutate('New Chat');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentSessionId || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      await sendMessageMutation.mutateAsync({ 
        sessionId: currentSessionId, 
        message: userMessage 
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)] rounded-lg overflow-hidden border border-border">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <button
            onClick={handleCreateSession}
            disabled={createSessionMutation.isLoading}
            className="btn btn-primary w-full flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {sessions?.map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{session.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {!currentSessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground mb-6">Create a new chat to ask questions about your study materials</p>
              <button
                onClick={handleCreateSession}
                className="btn btn-primary"
              >
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground shadow-sm border border-border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.role === 'assistant' && msg.cited_chunks?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-muted-foreground">
                          Sources: {msg.cited_chunks.length} document(s) referenced
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card text-card-foreground shadow-sm border border-border max-w-3xl px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about your study materials..."
                  className="input flex-1"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="btn btn-primary px-4"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}