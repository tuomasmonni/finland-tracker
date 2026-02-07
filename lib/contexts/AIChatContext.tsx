/**
 * AI Chat Context
 * Manages chat panel open/close state and active map artifacts
 */

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MapLayerArtifact } from '@/lib/ai/types';

interface AIChatContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  activeMapArtifacts: MapLayerArtifact[];
  addMapArtifact: (artifact: MapLayerArtifact) => void;
  removeMapArtifact: (id: string) => void;
  clearMapArtifacts: () => void;
}

const AIChatContext = createContext<AIChatContextValue | null>(null);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMapArtifacts, setActiveMapArtifacts] = useState<MapLayerArtifact[]>([]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((p) => !p), []);

  const addMapArtifact = useCallback((artifact: MapLayerArtifact) => {
    setActiveMapArtifacts((prev) => {
      // Replace if same ID, otherwise add
      const exists = prev.findIndex((a) => a.id === artifact.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = artifact;
        return next;
      }
      return [...prev, artifact];
    });
  }, []);

  const removeMapArtifact = useCallback((id: string) => {
    setActiveMapArtifacts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearMapArtifacts = useCallback(() => {
    setActiveMapArtifacts([]);
  }, []);

  return (
    <AIChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        activeMapArtifacts,
        addMapArtifact,
        removeMapArtifact,
        clearMapArtifacts,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used within AIChatProvider');
  return ctx;
}
