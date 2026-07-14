import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  FileSearch,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ApiError, api } from "../api";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/assistant")({ component: Assistant });

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

// Offline demo switch: when true, a canned reply is streamed if the backend can't be
// reached — for showing the UI with no backend. Keep FALSE in real use so genuine
// backend/LLM failures surface as errors instead of being masked by a fake answer.
const OFFLINE_DEMO = false;

const SUGGESTED: { icon: LucideIcon; label: string }[] = [
  { icon: FileSearch, label: "Summarize my most recent document." },
  { icon: Sparkles, label: "What can this platform do for my team?" },
  { icon: Bot, label: "Draft a status update from this week's activity." },
  { icon: ShieldCheck, label: "Explain how approvals work here." },
];

const CAPABILITIES: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: FileSearch, title: "Grounded", detail: "Answers cite your own documents when enabled." },
  { icon: ShieldCheck, title: "Controlled", detail: "Nothing posts — the assistant only drafts." },
  { icon: Sparkles, title: "Traced", detail: "Every turn is logged to your audit trail." },
];

/* ─────────────────────────  Dummy responses (prototype)  ───────────────────────── */

// Keyword-matched canned answers so the prototype always responds even without a
// live LLM backend. Uses **bold** and "• " bullets which the renderer styles.
function dummyReply(message: string, useRag: boolean): string {
  const q = message.toLowerCase();
  const cite = useRag ? "\n\n_Sources: Invoice AC-2214, Mercury statement (Jun), Q3 expense report._" : "";

  if (q.includes("summar") && (q.includes("document") || q.includes("recent") || q.includes("invoice"))) {
    return (
      "Here's a summary of your most recent document — **Invoice #AC-2214 from Acme Supplies**:\n\n" +
      "• **Amount:** $14,280.00 (Net 30, due Aug 07, 2026)\n" +
      "• **3-way match:** passed against PO-2214 and the goods receipt\n" +
      "• **Flag:** a $1,180.00 freight charge wasn't on the original PO — worth confirming\n" +
      "• **Status:** awaiting Controller approval before it posts" +
      cite
    );
  }
  if (q.includes("what can") || q.includes("platform do") || q.includes("for my team")) {
    return (
      "I'm your **accounting copilot**. I can take the busywork off your team across the ledger:\n\n" +
      "• **Document intelligence** — read invoices, receipts, and statements into clean data\n" +
      "• **AP/AR** — 3-way match, duplicate detection, collections drafts\n" +
      "• **Reconciliation** — auto-match bank activity and surface only the exceptions\n" +
      "• **Close & reporting** — accruals, variances, and board-ready statements\n\n" +
      "Everything I do is drafted for review — **nothing posts without a human approving it.**"
    );
  }
  if (q.includes("status update") || q.includes("this week") || q.includes("draft")) {
    return (
      "**Finance — weekly status**\n\n" +
      "• **Close:** July close is ~65% complete; bank recs done, 2 balance-sheet accounts left\n" +
      "• **AP:** 12 invoices processed, 5 awaiting approval, 1 duplicate held (Globex GX-2231)\n" +
      "• **AR:** collections drafted for 12 overdue accounts; DSO trending down\n" +
      "• **Risks:** one expense over the lodging cap pending justification\n\n" +
      "Want me to tailor this for a specific stakeholder?"
    );
  }
  if (q.includes("approval") || q.includes("approve")) {
    return (
      "**How approvals work here:**\n\n" +
      "• A copilot drafts an action (e.g. an invoice ready to post) and pauses\n" +
      "• It routes to the right approver based on type and amount thresholds\n" +
      "• The approver reviews the AI summary + control checks, then approves or rejects\n" +
      "• Only after sign-off does anything write back to your ledger — with a full audit trail" +
      cite
    );
  }
  if (q.includes("reconcil")) {
    return (
      "For the **June reconciliation**, 398 of 412 transactions auto-matched (**96.6%**). " +
      "14 exceptions are grouped — mostly bank fees and a pending deposit — and I've proposed 2 fee " +
      "journal entries for review. Shall I open the exceptions?" + cite
    );
  }
  if (q.includes("hello") || q.includes("hi ") || q.trim() === "hi" || q.includes("hey")) {
    return "Hi! I'm your accounting copilot. Ask me about your documents, the close, approvals, or reconciliation — or tap a suggestion to start.";
  }
  return (
    "Here's how I'd approach that: I'd pull the relevant documents and ledger data, draft a clear " +
    "answer, and flag anything that needs your review before it posts. Try asking about a **specific " +
    "invoice, the month-end close, approvals, or reconciliation.**" + cite
  );
}

/* ─────────────────────────  Page  ───────────────────────── */

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const appendToLast = (delta: string) =>
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { role: "assistant", content: last.content + delta };
      return copy;
    });

  // Replace the (empty) trailing assistant bubble with a clear, visible error notice.
  const showError = (msg: string) =>
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}`, error: true };
      return copy;
    });

  // Stream a canned answer word-by-word (offline demo only — see OFFLINE_DEMO).
  const streamDummy = async (full: string) => {
    const tokens = full.match(/\S+\s*/g) ?? [full];
    for (const t of tokens) {
      await new Promise((r) => setTimeout(r, 22));
      appendToLast(t);
    }
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || streaming) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    let errorMsg = "";
    try {
      let got = false;
      for await (const chunk of api.chatStream({
        message,
        session_id: sessionId.current,
        use_rag: useRag,
        workspace: "accounting", // this is the Accounting workspace
      })) {
        if (chunk.session_id) sessionId.current = chunk.session_id;
        if (chunk.error) {
          errorMsg = chunk.error; // backend signalled a failure (e.g. LLM unavailable)
          break;
        }
        if (chunk.delta) {
          got = true;
          appendToLast(chunk.delta);
        }
      }
      if (!got && !errorMsg) {
        errorMsg = "The assistant didn't return a response. Please try again.";
      }
    } catch (e) {
      errorMsg =
        e instanceof ApiError
          ? `The assistant is unavailable (${e.status}). Please try again shortly.`
          : "Couldn't reach the assistant. Check your connection and try again.";
    } finally {
      setStreaming(false);
    }

    if (errorMsg) {
      // Real backend failure: surface it — never silently fake an answer. (Flip
      // OFFLINE_DEMO to true only to demo the UI with a canned reply when there is no backend.)
      if (OFFLINE_DEMO) await streamDummy(dummyReply(message, useRag));
      else showError(errorMsg);
    }
  };

  const reset = () => {
    setMessages([]);
    sessionId.current = undefined;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            AI Assistant
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Chat grounded in your organization's data
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Copilot online
          </span>
          {hasMessages && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="nice-scroll flex-1 overflow-y-auto rounded-2xl border border-border bg-surface/50 p-4 md:p-6"
      >
        {hasMessages ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    m.role === "user"
                      ? "bg-secondary text-secondary-foreground"
                      : "brand-gradient text-primary-foreground shadow-sm shadow-primary/25",
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : m.error
                        ? "rounded-tl-sm border border-destructive/40 bg-destructive/10 text-destructive"
                        : "rounded-tl-sm border border-border bg-card text-foreground",
                  )}
                >
                  {m.content ? (
                    <RichText text={m.content} />
                  ) : streaming ? (
                    <TypingDots />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onAsk={send} />
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Message the assistant…"
            disabled={streaming}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-lg text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Use my documents
          </label>
          <span className="text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </span>
        </div>
      </form>
    </div>
  );
}

function EmptyState({ onAsk }: { onAsk: (p: string) => void }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col py-8">
      <div className="text-center">
        <div className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground shadow-lg shadow-primary/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
          Workspace Copilot
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Ask anything, or start with a suggestion.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The assistant reasons over your organization's data and drafts answers for you — every
          turn is traced.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTED.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onAsk(s.label)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium">{s.label}</span>
              <Send className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CAPABILITIES.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="rounded-xl border border-border bg-surface p-4">
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-2 text-sm font-semibold">{c.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Lightweight renderer: **bold**, "• " bullets, and preserved line breaks.
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        const bullet = line.trimStart().startsWith("• ");
        const body = bullet ? line.trimStart().slice(2) : line;
        return (
          <div key={i} className={cn("flex gap-2", bullet && "pl-1")}>
            {bullet && <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />}
            <span className="whitespace-pre-wrap">{renderBold(body)}</span>
          </div>
        );
      })}
    </div>
  );
}

function renderBold(text: string) {
  return text.split(/(\*\*.+?\*\*|_.+?_)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return (
        <em key={i} className="text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </span>
  );
}
