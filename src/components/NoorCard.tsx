"use client";

import Conversation from "./noor/Conversation";
import NoorHeader from "./noor/NoorHeader";

/**
 * Noor's live chat card, overlapping the hero photo's bottom-left corner on
 * desktop and sitting inside its bottom edge, so the hero keeps equal space
 * above and below. Shares its conversation with the floating panel. The only
 * element with a shadow.
 */
export default function NoorCard() {
  return (
    <div
      id="noor"
      className="relative mx-3 -mt-10 scroll-mt-28 overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_24px_50px_-20px_rgba(11,37,69,0.35)] desk:absolute desk:bottom-6 desk:-left-14 desk:mx-0 desk:mt-0 desk:w-[380px]"
    >
      <NoorHeader />
      <Conversation inputId="noor-card-input" scrollClassName="max-h-[380px] desk:max-h-[clamp(150px,calc(100svh_-_430px),330px)]" />
    </div>
  );
}
