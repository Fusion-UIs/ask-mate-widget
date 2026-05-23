import React, {
    useState,
    useRef,
    useEffect,
    type KeyboardEvent,
    type ChangeEvent,
} from "react";

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

type Position =
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left";

type AskMateProps = {
    position?: Position;
    theme?: "dark" | "light";
    botName?: string;
    greeting?: string;
    placeholder?: string;
    suggestions?: Suggestion[];
    apiKey?: string;
    onSend?: (
        content: string,
        messages: Message[]
    ) => Promise<string>;
    accentColor?: string;
    triggerLabel?: string;
    defaultOpen?: boolean;
};

type AnthropicResponse = {
    content?: {
        text?: string;
    }[];
};

const FMateIcon = () => (
    <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="22" cy="22" r="22" fill="white" fillOpacity="0.12" />

        <path
            d="M22 10C22 10 14 16 14 22C14 26.4 17.6 30 22 30C26.4 30 30 26.4 30 22C30 16 22 10 22 10Z"
            fill="#A855F7"
            fillOpacity="0.8"
        />

        <path
            d="M19 20L22 14L25 20"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <circle cx="22" cy="23" r="1.5" fill="white" />

        <path
            d="M18 27H26"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const SendIcon = () => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
    >
        <path
            d="M22 2L11 13"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <path
            d="M22 2L15 22L11 13L2 9L22 2Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CloseIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
    >
        <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const defaultSuggestions: Suggestion[] = [
    {
        icon: "💻",
        title: "Generate Code",
        description: "Write or debug code in any language",
        color: "#EF4444",
    },
    {
        icon: "✍️",
        title: "Draft Content",
        description: "Create emails, docs, or copy fast",
        color: "#F97316",
    },
    {
        icon: "📊",
        title: "Analyze Data",
        description: "Summarize and extract insights",
        color: "#10B981",
    },
];

const AnimationStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');



        @keyframes am-slide-in {
            from {
                opacity: 0;
                transform: translateX(20px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes am-dot {
            0%, 80%, 100% {
                transform: scale(1);
                opacity: 0.4;
            }

            40% {
                transform: scale(1.3);
                opacity: 1;
            }
        }

        .am-slide-in {
            animation: am-slide-in .22s ease;
        }

        .am-typing span {
            animation: am-dot 1.2s infinite;
        }

        .am-typing span:nth-child(2) {
            animation-delay: .2s;
        }

        .am-typing span:nth-child(3) {
            animation-delay: .4s;
        }

        .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 999px;
        }
    `}</style>
);

export function AskMate({
    botName = "F-MATE",
    greeting = "What are you working on today?",
    placeholder = "Ask Mate anything",
    suggestions = defaultSuggestions,
    apiKey,
    onSend,
    accentColor = "#A855F7",
    triggerLabel = "Ask Mate",
    defaultOpen = false,
}: AskMateProps) {
    const [open, setOpen] = useState(defaultOpen);

    const [messages, setMessages] = useState<Message[]>([]);

    const [input, setInput] = useState("");

    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(
        null
    );

    const inputRef = useRef<HTMLInputElement | null>(
        null
    );

    useEffect(() => {
        inputRef.current?.focus();

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, open]);

    const handleSend = async (text?: string) => {
        const content = text || input.trim();

        if (!content) return;

        setInput("");

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            content,
        };

        setMessages((prev) => [...prev, userMsg]);

        setLoading(true);

        try {
            if (onSend) {
                const reply = await onSend(
                    content,
                    messages
                );

                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: "assistant",
                        content: reply,
                    },
                ]);

                return;
            }

            if (apiKey) {
                const res = await fetch(
                    "https://api.anthropic.com/v1/messages",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-api-key": apiKey,

                            "anthropic-version":
                                "2023-06-01",
                        },

                        body: JSON.stringify({
                            model:
                                "claude-3-haiku-20240307",

                            max_tokens: 1024,

                            messages: [
                                ...messages,
                                userMsg,
                            ].map((m) => ({
                                role: m.role,
                                content: m.content,
                            })),
                        }),
                    }
                );

                const data: AnthropicResponse =
                    await res.json();

                const reply =
                    data.content?.[0]?.text ||
                    "No response.";

                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: "assistant",
                        content: reply,
                    },
                ]);
            } else {
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now() + 1,
                            role: "assistant",
                            content: `You said: "${content}"`,
                        },
                    ]);
                }, 700);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content:
                        "Something went wrong.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const showWelcome = messages.length === 0;

    return (
        <>
            <AnimationStyles />


            <div className="fixed top-4 right-4 z-[9999]">
                <button
                    onClick={() => setOpen(!open)}
                    className="h-9 px-4 rounded-full text-white text-sm font-semibold flex items-center gap-2"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)`,
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                    </svg>

                    {triggerLabel}
                </button>
            </div>


            {open && (
                <div className="fixed top-[58px] right-0 h-[calc(100vh-58px)] w-[320px] z-[9999] font-['Plus Jakarta Sans']">
                    <div className="am-slide-in h-full w-full flex flex-col overflow-hidden border-l border-[#1E293B] bg-black">

                        {/* HEADER */}

                        <div className="h-[52px] px-4 border-b border-[#1E293B] flex items-center justify-between bg-[#020617]">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center"
                                    style={{
                                        background: `${accentColor}20`,
                                    }}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill={accentColor}
                                    >
                                        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                                    </svg>
                                </div>

                                <span className="text-[12px] font-semibold text-white">
                                    Chat Mate
                                </span>
                            </div>

                            <div className="flex items-center gap-3">


                                <button
                                    onClick={() =>
                                        setOpen(false)
                                    }
                                    className="text-slate-500 hover:text-white transition"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            {showWelcome ? (
                                <div className="flex flex-col items-center px-5 pt-10">

                                    <div
                                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4"
                                        style={{
                                            background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)`,
                                        }}
                                    >
                                        <FMateIcon />
                                    </div>

                                    <div className="text-[11px] tracking-[0.25em] font-bold uppercase text-[#A855F7] mb-3">
                                        {botName}
                                    </div>

                                    <h2 className="text-[28px] leading-[34px] font-bold text-white text-center max-w-[220px] mb-8">
                                        {greeting}
                                    </h2>

                                    <div className="w-full flex flex-col gap-3">
                                        {suggestions.map(
                                            (s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        handleSend(
                                                            s.title
                                                        )
                                                    }
                                                    className="
                                                    group
                                                    flex
                                                    items-center
                                                    gap-3
                                                    px-3
                                                    py-3
                                                    rounded-xl
                                                    bg-[#0B1120]
                                                    border
                                                    border-[#1E293B]
                                                    hover:border-[#334155]
                                                    transition-all
                                                "
                                                >
                                                    <div
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
                                                        style={{
                                                            background: `${s.color}15`,
                                                            color: s.color,
                                                        }}
                                                    >
                                                        {
                                                            s.icon
                                                        }
                                                    </div>

                                                    <div className="flex-1 text-left">
                                                        <div className="text-[13px] font-semibold text-white">
                                                            {
                                                                s.title
                                                            }
                                                        </div>

                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {
                                                                s.description
                                                            }
                                                        </div>
                                                    </div>

                                                    <span className="text-slate-500">
                                                        ›
                                                    </span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-4 flex flex-col gap-4">
                                    {messages.map((m) => (
                                        <div
                                            key={m.id}
                                            className={`flex ${m.role ===
                                                "user"
                                                ? "justify-end"
                                                : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${m.role ===
                                                    "user"
                                                    ? "text-white"
                                                    : "bg-[#0B1120] border border-[#1E293B] text-slate-100"
                                                    }`}
                                                style={
                                                    m.role ===
                                                        "user"
                                                        ? {
                                                            background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)`,
                                                        }
                                                        : {}
                                                }
                                            >
                                                {
                                                    m.content
                                                }
                                            </div>
                                        </div>
                                    ))}

                                    {loading && (
                                        <div className="flex">
                                            <div className="am-typing flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0B1120] border border-[#1E293B]">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        background:
                                                            accentColor,
                                                    }}
                                                />

                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        background:
                                                            accentColor,
                                                    }}
                                                />

                                                <span
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{
                                                        background:
                                                            accentColor,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        ref={
                                            messagesEndRef
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}

                        <div className="mt-auto p-3 border-t border-[#1E293B] bg-black">
                            <div className="relative rounded-2xl border border-[#7C3AED] bg-[#0B1120] p-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) =>
                                        setInput(
                                            e.target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        e: KeyboardEvent<HTMLInputElement>
                                    ) =>
                                        e.key ===
                                        "Enter" &&
                                        handleSend()
                                    }
                                    placeholder={
                                        placeholder
                                    }
                                    className="
                                        w-full
                                        bg-transparent
                                        border-none
                                        outline-none
                                        text-[13px]
                                        text-white
                                        placeholder:text-slate-500
                                        pr-10
                                    "
                                />

                                <button
                                    onClick={() =>
                                        handleSend()
                                    }
                                    disabled={
                                        !input.trim()
                                    }
                                    className="
                                        absolute
                                        right-2
                                        bottom-2
                                        w-7
                                        h-7
                                        rounded-full
                                        flex
                                        items-center
                                        justify-center
                                        transition-all
                                    "
                                    style={{
                                        background:
                                            accentColor,

                                        opacity:
                                            input.trim()
                                                ? 1
                                                : 0.4,
                                    }}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AskMate;