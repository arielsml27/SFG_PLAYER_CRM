"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        window.prompt("Copy this link:", url);
      } catch {
        // clipboard and prompt both unavailable — nothing more we can do
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={handleCopy} className="btn btn-outline">
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      {copied ? "Link Copied" : "Copy Link"}
    </button>
  );
}
