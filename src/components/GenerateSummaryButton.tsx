"use client";

import { useFormStatus } from "react-dom";

export default function GenerateSummaryButton({ hasSummary }: { hasSummary: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
      {pending ? "Generating… (up to a minute)" : hasSummary ? "Regenerate Summary" : "Generate AI Summary"}
    </button>
  );
}
