"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Message = { kind: "success" | "error"; text: string };

export function SetupForm() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok?: boolean; email?: string; error?: string };
      if (res.ok && data.ok) {
        setMessage({ kind: "success", text: `Setup complete. Super Admin created for ${data.email}.` });
        setToken("");
      } else {
        setMessage({ kind: "error", text: data.error ?? "Setup failed. Try again." });
      }
    } catch {
      setMessage({ kind: "error", text: "Could not reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="token">Setup token</Label>
        <Input
          id="token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">The SETUP_TOKEN value you added in Vercel.</p>
      </div>
      <Button type="submit" disabled={busy || token.length === 0}>
        {busy ? "Creating account…" : "Run setup"}
      </Button>
      {message && (
        <p role="status" className={message.kind === "success" ? "text-sm text-success" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
