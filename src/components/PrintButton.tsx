"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-gold">
      Print / Save as PDF
    </button>
  );
}
