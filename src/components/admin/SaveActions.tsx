"use client";

import { useState } from "react";

interface SaveActionsProps {
  onPublish?: () => void;
}

export default function SaveActions({ onPublish }: SaveActionsProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");

  const handlePublish = () => {
    setStatus("saving");
    setTimeout(() => {
      setStatus("success");
      onPublish?.();
      setTimeout(() => setStatus("idle"), 2000);
    }, 1000);
  };

  const getButtonClasses = () => {
    const base = "w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all";
    if (status === "success") {
      return `${base} bg-green-600 text-white`;
    }
    if (status === "saving") {
      return `${base} bg-primary text-on-primary opacity-50`;
    }
    return `${base} bg-primary text-on-primary`;
  };

  const getButtonText = () => {
    if (status === "success") return "Published!";
    if (status === "saving") return "Publishing...";
    return (
      <>
        <span className="material-symbols-outlined">save</span>
        Publish Schedule
      </>
    );
  };

  return (
    <section className="px-container-margin mt-auto pt-4">
      <button
        onClick={handlePublish}
        disabled={status !== "idle"}
        className={getButtonClasses()}
      >
        {getButtonText()}
      </button>
    </section>
  );
}