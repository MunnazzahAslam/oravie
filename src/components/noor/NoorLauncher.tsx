"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import NoorAvatar from "../NoorAvatar";
import Conversation from "./Conversation";
import NoorHeader from "./NoorHeader";
import { useNoor } from "./NoorProvider";

/** Floating "Ask Noor" button on every section, and the chat panel it opens. */
export default function NoorLauncher() {
  const { panelOpen, openPanel, closePanel } = useNoor();
  const [heroCardVisible, setHeroCardVisible] = useState(true);
  const launcher = useRef<HTMLButtonElement>(null);

  // While Noor's hero card is on screen, the floating button would be a duplicate.
  useEffect(() => {
    const card = document.getElementById("noor");
    if (!card) return;
    const io = new IntersectionObserver(([e]) => setHeroCardVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(card);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const button = launcher.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    // Full-screen on phones: stop the page scrolling underneath.
    const phone = window.matchMedia("(max-width: 639px)").matches;
    if (phone) document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      button?.focus();
    };
  }, [panelOpen, closePanel]);

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={panelOpen}
        className={`fixed right-5 bottom-5 z-40 flex h-14 items-center gap-3 rounded-full bg-blue pr-5 pl-2 text-white shadow-[0_18px_40px_-14px_rgba(11,37,69,0.55)] transition-[opacity,transform,background-color] duration-300 hover:bg-blue-hover ${
          panelOpen || heroCardVisible ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"
        }`}
        tabIndex={panelOpen || heroCardVisible ? -1 : 0}
      >
        <span className="relative">
          <NoorAvatar size={40} className="bg-white/15" />
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-blue bg-ok-bright" aria-hidden="true" />
        </span>
        <span className="text-[15px] font-bold">Ask Noor</span>
      </button>

      {panelOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Chat with Noor"
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(660px,calc(100dvh-3rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-[14px] sm:border sm:border-line sm:shadow-[0_24px_50px_-20px_rgba(11,37,69,0.35)]"
        >
          <NoorHeader
            action={
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close chat"
                className="-mr-1.5 ml-1 grid h-9 w-9 place-items-center rounded-lg text-slate hover:bg-ice hover:text-navy"
              >
                <X size={18} />
              </button>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <Conversation inputId="noor-panel-input" scrollClassName="min-h-0 flex-1" autoFocus />
          </div>
        </div>
      )}
    </>
  );
}
