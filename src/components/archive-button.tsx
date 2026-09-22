"use client";

import { Archive, ArchiveRestore, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ArchiveButtonProps = {
  kind: "sent" | "conversation";
  id: string;
  archived: boolean;
};

export function ArchiveButton({ kind, id, archived }: ArchiveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = archived ? "Przywróć" : "Archiwizuj";

  async function updateArchive() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, archived: !archived }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Nie udało się zmienić archiwizacji.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nie udało się zmienić archiwizacji.");
      setBusy(false);
    }
  }

  const Icon = busy ? LoaderCircle : archived ? ArchiveRestore : Archive;
  return <span className="archive-control">
    <button className="archive-button" type="button" onClick={updateArchive} disabled={busy} aria-label={`${label} ${kind === "sent" ? "wiadomość" : "rozmowę"}`} title={label}>
      <Icon size={14} className={busy ? "spinner" : undefined} />
      <span>{busy ? "Zapisywanie…" : label}</span>
    </button>
    {error && <span className="archive-error" role="alert">{error}</span>}
  </span>;
}
