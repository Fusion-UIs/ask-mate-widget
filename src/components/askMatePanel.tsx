import React, {
    useState,
    useRef,
    useEffect,
    type KeyboardEvent,
    type ChangeEvent,
} from "react";
import { Share2, X } from "lucide-react";

import FMateIcon from "../assets/fmate-icon.svg";
import { useAskMate } from "../contexts/AskMateContext";

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
};

type Suggestion = {
    icon: string;
    title: string;
    description: string;
    color: string;
};

type AskMateProps = {
    botName?: string;
    greeting?: string;
    placeholder?: string;
    suggestions?: Suggestion[];
    apiKey?: string;
    onSend?: (content: string, messages: Message[]) => Promise<string>;
    accentColor?: string;
    triggerLabel?: string;
};

type AnthropicResponse = {
    content?: { text?: string }[];
};

const SendIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const defaultSuggestions: Suggestion[] = [
    { icon: "💻", title: "Generate Code", description: "Write or debug code in any language", color: "#EF4444" },
    { icon: "✍️", title: "Draft Content", description: "Create emails, docs, or copy fast", color: "#F97316" },
    { icon: "📊", title: "Analyze Data", description: "Summarize and extract insights", color: "#10B981" },
];

const AnimationStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    @keyframes am-slide-in {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes am-dot {
      0%, 80%, 100% { transform: scale(1);   opacity: 0.4; }
      40%           { transform: scale(1.3); opacity: 1;   }
    }

    .am-slide-in { animation: am-slide-in .22s ease; }

    .am-typing span { animation: am-dot 1.2s infinite; }
    .am-typing span:nth-child(2) { animation-delay: .2s; }
    .am-typing span:nth-child(3) { animation-delay: .4s; }

    .am-scrollbar::-webkit-scrollbar       { width: 4px; }
    .am-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }

    /* ── Light-mode panel tokens ── */
    .am-panel {
      --am-bg:          hsl(var(--background));
      --am-bg-header:   hsl(var(--card));
      --am-bg-surface:  hsl(var(--secondary));
      --am-border:      hsl(var(--border));
      --am-text:        hsl(var(--foreground));
      --am-text-muted:  hsl(var(--muted-foreground));
      --am-input-bg:    hsl(var(--secondary));
    }

    /* ── Dark-mode panel tokens ── */
    .dark .am-panel {
      --am-bg:          oklch(17.218% 0.00706 258.414);
      --am-bg-header:   oklch(19.927% 0.01111 260.69);
      --am-bg-surface:  oklch(13% 0.012 260);
      --am-border:      #1E293B;
      --am-text:        #ffffff;
      --am-text-muted:  #475569;
      --am-input-bg:    oklch(13% 0.012 260);
    }

    /* Convenience utility classes scoped to .am-panel */
    .am-panel .am-bg          { background-color: var(--am-bg); }
    .am-panel .am-bg-header   { background-color: var(--am-bg-header); }
    .am-panel .am-bg-surface  { background-color: var(--am-bg-surface); }
    .am-panel .am-border-c    { border-color: var(--am-border); }
    .am-panel .am-text        { color: var(--am-text); }
    .am-panel .am-text-muted  { color: var(--am-text-muted); }
  `}</style>
);

export function AskMatePanel({
    greeting = "What are you working on today?",
    placeholder = "Ask Mate anything",
    suggestions = defaultSuggestions,
    apiKey,
    onSend,
    accentColor = "#A855F7",
}: AskMateProps) {
    const { open, setOpen } = useAskMate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const handleShare = () => { };

    const handleSend = async (text?: string) => {
        const content = text || input.trim();
        if (!content) return;

        setInput("");

        const userMsg: Message = { id: Date.now(), role: "user", content };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            if (onSend) {
                const reply = await onSend(content, messages);
                setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: reply }]);
                return;
            }

            if (apiKey) {
                const res = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                    },
                    body: JSON.stringify({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1024,
                        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
                    }),
                });

                const data: AnthropicResponse = await res.json();
                const reply = data.content?.[0]?.text || "No response.";
                setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: reply }]);
            } else {
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        { id: Date.now() + 1, role: "assistant", content: `You said: "${content}"` },
                    ]);
                }, 700);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, role: "assistant", content: "Something went wrong." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const showWelcome = messages.length === 0;

    return (
        <>
            <AnimationStyles />

            {/*
             * am-panel  → applies CSS token vars (light or dark via .dark ancestor)
             * All colour classes below (am-bg, am-border-c, etc.) pull from those vars.
             */}
            <div className="am-panel fixed top-14.5 right-0 h-[calc(100vh-58px)] w-88 z-[9999] font-['Plus_Jakarta_Sans']">
                <div className="am-slide-in am-bg h-full w-full flex flex-col overflow-hidden border-l am-border-c">

                    {/* ── HEADER ── */}
                    <div className="am-bg-header h-13 px-4 border-b am-border-c flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold am-text">Chat Mate</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="am-text-muted hover:am-text transition"
                                title="Share"
                            >
                                <Share2 size={15} />
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="am-text-muted hover:am-text transition"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* ── CONTENT ── */}
                    <div className="flex-1 overflow-y-auto am-scrollbar">
                        {showWelcome ? (
                            <div className="flex flex-col items-center px-5 pt-10">
                                {/* Avatar */}
                                <div
                                    className="rounded-full flex items-center justify-center mb-4"
                                    style={{
                                        background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)`,
                                    }}
                                >
                                    <FMateIcon />
                                </div>

                                <h2 className="text-[28px] leading-[2.125rem] font-bold am-text text-center mb-8">
                                    {greeting}
                                </h2>

                                {/* Suggestion cards */}
                                <div className="w-full flex flex-col gap-3">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(s.title)}
                                            className="group flex items-center gap-3 px-3 py-3 rounded-xl am-bg-surface border am-border-c hover:opacity-80 transition-all relative overflow-hidden"
                                        >
                                            <span
                                                className="absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl"
                                                style={{ background: s.color }}
                                            />
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm border ml-1"
                                                style={{
                                                    background: `${s.color}15`,
                                                    borderColor: `${s.color}40`,
                                                }}
                                            >
                                                {s.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="text-[13px] font-semibold am-text">
                                                    {s.title}
                                                </div>
                                                <div className="text-[11px] am-text-muted mt-0.5">
                                                    {s.description}
                                                </div>
                                            </div>
                                            <span className="am-text-muted">›</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-4 flex flex-col gap-4">
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user"
                                                    ? "text-white"
                                                    : "am-bg-surface border am-border-c am-text"
                                                }`}
                                            style={
                                                m.role === "user"
                                                    ? {
                                                        background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)`,
                                                    }
                                                    : {}
                                            }
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex">
                                        <div className="am-typing flex items-center gap-1.5 px-4 py-3 rounded-2xl am-bg-surface border am-border-c">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: accentColor }}
                                            />
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: accentColor }}
                                            />
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ background: accentColor }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="mt-auto p-3 border-t am-border-c am-bg">
                        <div
                            className="relative rounded-2xl p-2"
                            style={{
                                background: "var(--am-input-bg)",
                                border: `1.5px solid ${accentColor}`,
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                                    e.key === "Enter" && handleSend()
                                }
                                placeholder={placeholder}
                                className="w-full bg-transparent border-none outline-none text-[13px] am-text placeholder:am-text-muted pr-10"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="absolute right-2 bottom-2 w-7 h-7 rounded-full flex items-center justify-center transition-all text-white"
                                style={{
                                    background: accentColor,
                                    opacity: input.trim() ? 1 : 0.4,
                                }}
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}