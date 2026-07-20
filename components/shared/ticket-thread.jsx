"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessagesSquare, Lock } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Conversation thread + reply composer, shared by the learner and admin ticket
 * views. `viewerRole` decides which bubbles are "mine" (right-aligned, indigo).
 */
export function TicketThread({ messages = [], viewerRole, onSend, sending = false, disabled = false, disabledHint }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending || disabled) return;
    await onSend(body);
    setText("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Box className="flex flex-col min-h-0">
      {/* Thread */}
      <Box className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <Box className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Box className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
              <MessagesSquare className="h-5 w-5 text-slate-400" />
            </Box>
            <Text as="p" className="text-xs text-slate-400">No replies yet. Start the conversation below.</Text>
          </Box>
        ) : (
          messages.map((m) => {
            const mine = m.author_role === viewerRole;
            const isAdmin = m.author_role === "admin";
            return (
              <Box key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                <Box className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isAdmin ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {initialsOf(m.author_name)}
                </Box>
                <Box className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <Box className={`flex items-center gap-1.5 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    <Text as="span" className="text-[11px] font-semibold text-slate-600">{m.author_name}</Text>
                    <Text as="span" className="text-[10px] text-slate-400">{formatTime(m.created_at)}</Text>
                  </Box>
                  <Box className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                    mine
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-700 rounded-bl-md"
                  }`}>
                    {m.body}
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={endRef} />
      </Box>

      {/* Composer */}
      <Box className="mt-3 pt-3 border-t border-slate-100">
        {disabled ? (
          <Box className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-3">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <Text as="span" className="text-xs text-slate-500">{disabledHint || "This ticket is closed."}</Text>
          </Box>
        ) : (
          <Box className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Write a reply…  (Enter to send, Shift+Enter for a new line)"
              rows={2}
              maxLength={4000}
              className="flex-1 bg-white border-slate-200 rounded-xl text-sm resize-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-violet-300"
            />
            <Button
              onClick={send}
              disabled={!text.trim() || sending}
              className="h-10 w-10 p-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0"
              aria-label="Send reply"
            >
              <Send className="h-4 w-4" />
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
