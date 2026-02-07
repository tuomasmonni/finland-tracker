/**
 * Chat Message - Message bubble with artifact slots
 */

'use client';

import type { ChatMessage as ChatMessageType } from '@/lib/ai/types';
import ArtifactRenderer from './ArtifactRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] ${
          isUser
            ? 'bg-blue-600/80 text-white rounded-2xl rounded-br-md px-3 py-2'
            : 'text-zinc-200'
        }`}
      >
        {/* Text content */}
        {message.content && (
          <div className={`text-sm whitespace-pre-wrap leading-relaxed ${!isUser ? 'px-1' : ''}`}>
            {message.content}
          </div>
        )}

        {/* Artifacts */}
        {message.artifacts.length > 0 && (
          <div className={`${message.content ? 'mt-2' : ''}`}>
            {message.artifacts.map((artifact) => (
              <ArtifactRenderer key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
