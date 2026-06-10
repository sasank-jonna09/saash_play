import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ messages, onSend, myName, peerName }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 chat-scroll">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm px-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-sm">
              <svg className="w-8 h-8 text-gray-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="font-bold text-gray-300">No messages yet</p>
            <p className="text-xs text-gray-500 font-medium">Say hello to your co-watcher!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === 'me';
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 px-1">
                  {isMe ? myName : (peerName || 'Peer')}
                </span>
                <div className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed shadow-sm font-medium
                  ${isMe
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20'
                    : 'bg-black/40 border border-white/10 text-gray-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-40 touch-manipulation flex-shrink-0 active:scale-95"
          >
            <svg className="w-5 h-5 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
