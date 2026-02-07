/**
 * Chat Input - Text input with suggested questions
 */

'use client';

import { useState, useRef, useCallback } from 'react';

const SUGGESTED_QUESTIONS = [
  'Mitkä kunnat ovat turvallisimpia?',
  'Missä on korkein työttömyys?',
  'Vertaa Oulua ja Tamperetta',
  'Korreloiko rikollisuus ja työttömyys?',
];

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  showSuggestions: boolean;
}

export default function ChatInput({ onSend, isLoading, showSuggestions }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-zinc-700/60 bg-zinc-900/95">
      {/* Suggested questions */}
      {showSuggestions && (
        <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSend(q)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full text-[11px] bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Kysy kuntadatasta..."
          rows={1}
          className="flex-1 resize-none bg-zinc-800 text-sm text-zinc-200 rounded-xl px-3 py-2 border border-zinc-700/60 focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
