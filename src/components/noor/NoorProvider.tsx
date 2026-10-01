"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { NOOR_LIMITS } from "@/lib/noor/limits";

export type NoorProblem = "offline" | "too-long" | "busy" | "error" | null;

type NoorContext = {
  chat: UseChatHelpers<UIMessage>;
  send: (text: string) => void;
  ask: (text: string) => void;
  busy: boolean;
  problem: NoorProblem;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const Ctx = createContext<NoorContext | null>(null);

/** Maps a failed request to something we can say to a patient. */
function classify(error: Error | undefined): NoorProblem {
  if (!error) return null;
  const m = error.message;
  if (m.includes("noor-offline")) return "offline";
  if (m.includes("message-too-long")) return "too-long";
  if (m.includes("rate-limited")) return "busy";
  return "error";
}

/**
 * Talk to Noor where she's already visible: the hero card when it's mostly on
 * screen, otherwise the floating panel.
 */
function heroCardInView() {
  const card = document.getElementById("noor")?.getBoundingClientRect();
  return !!card && card.top >= 0 && card.bottom <= window.innerHeight + 40;
}

/** One conversation with Noor, shared by the hero card and the floating panel. */
export function NoorProvider({ children }: { children: ReactNode }) {
  const chat = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    experimental_throttle: 40,
  });
  const [panelOpen, setPanelOpen] = useState(false);
  // Stable, so effects keyed on them don't re-run (and steal focus) on every render.
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const busy = chat.status === "submitted" || chat.status === "streaming";

  const send = useCallback(
    (text: string) => {
      const clean = text.trim().slice(0, NOOR_LIMITS.maxInputChars);
      if (!clean || busy) return;
      if (chat.error) chat.clearError();
      chat.sendMessage({ text: clean });
    },
    [busy, chat],
  );

  /** Opens Noor (card or panel) and asks her something on the patient's behalf. */
  const ask = useCallback(
    (text: string) => {
      if (!heroCardInView()) setPanelOpen(true);
      send(text);
    },
    [send],
  );

  // "Book appointment" buttons (data-open-noor) focus the card or open the panel.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-open-noor]");
      if (!el) return;
      e.preventDefault();
      if (heroCardInView()) {
        document.getElementById("noor-card-input")?.focus();
      } else {
        setPanelOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <Ctx
      value={{
        chat,
        send,
        ask,
        busy,
        problem: classify(chat.error),
        panelOpen,
        openPanel,
        closePanel,
      }}
    >
      {children}
    </Ctx>
  );
}

export function useNoor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNoor must be used inside <NoorProvider>");
  return ctx;
}
