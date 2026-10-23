"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessagesSquare, Lock, Pencil, Check, X } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { formatInstantDateTime } from "@/lib/datetime";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

// Message timestamps are real instants — shown on the reader's own clock.
function formatTime(iso) {
  return formatInstantDateTime(iso, { day: "2-digit", year: undefined, hour: "2-digit", fallback: "" });
}

/**
 * Conversation thread + reply composer, shared by the learner and admin ticket
 * views. `viewerRole` decides which bubbles are "mine" (right-aligned, indigo).
 */
export function TicketThread({ messages = [], viewerRole, onSend, onEdit, sending = false, disabled = false, disabledHint }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function startEdit(m) {
    setEditingId(m.id);
    setEditText(m.body);
  }

  async function saveEdit(id) {
    const body = editText.trim();
    if (!body || savingEdit) return;
    setSavingEdit(true);
    try {
      await onEdit(id, body);
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

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
    <Box className="flex flex-1 flex-col min-h-0">
      {/* Thread */}
      <Box className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <Box className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Box className="w-11 h-11 rounded-2xl bg-surface-muted flex items-center justify-center">
              <MessagesSquare className="h-5 w-5 text-foreground-subtle" />
            </Box>
            <Text as="p" className="text-xs text-foreground-subtle">No replies yet. Start the conversation below.</Text>
          </Box>
        ) : (
          messages.map((m) => {
            const mine = m.author_role === viewerRole;
            const isAdmin = m.author_role === "admin";
            return (
              <Box key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                <Box className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isAdmin ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success-subtle-foreground"}`}>
                  {initialsOf(m.author_name)}
                </Box>
                <Box className={`group max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <Box className={`flex items-center gap-1.5 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    <Text as="span" className="text-[11px] font-semibold text-foreground-muted">{m.author_name}</Text>
                    <Text as="span" className="text-[10px] text-foreground-subtle">{formatTime(m.created_at)}</Text>
                    {m.edited_at && <Text as="span" className="text-[10px] italic text-foreground-subtle">· edited</Text>}
                  </Box>

                  {editingId === m.id ? (
                    <Box className="w-full min-w-[260px] flex flex-col gap-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        maxLength={4000}
                        autoFocus
                        className="max-h-48 overflow-y-auto bg-surface border-border rounded-xl text-sm resize-none"
                      />
                      <Box className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={savingEdit}
                          className="h-8 px-3 text-foreground-muted text-xs">
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(m.id)} disabled={savingEdit || !editText.trim()}
                          className="h-8 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs">
                          <Check className="h-3.5 w-3.5 mr-1" /> {savingEdit ? "Saving…" : "Save"}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Box className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-surface-muted text-foreground rounded-bl-md"
                      }`}>
                        {m.body}
                      </Box>
                      {onEdit && mine && m.editable && (
                        <button type="button" onClick={() => startEdit(m)}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            );
          })
        )}
        <div ref={endRef} />
      </Box>

      {/* Composer */}
      <Box className="mt-3 pt-3 border-t border-border">
        {disabled ? (
          <Box className="flex items-center justify-center gap-2 rounded-xl bg-surface-hover px-3 py-3">
            <Lock className="h-3.5 w-3.5 text-foreground-subtle" />
            <Text as="span" className="text-xs text-foreground-muted">{disabledHint || "This ticket is closed."}</Text>
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
              className="flex-1 max-h-32 overflow-y-auto bg-surface border-border rounded-xl text-sm resize-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-primary-border"
            />
            <Button
              onClick={send}
              disabled={!text.trim() || sending}
              className="h-10 w-10 p-0 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shrink-0"
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
