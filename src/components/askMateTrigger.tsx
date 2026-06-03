import { useAskMate } from "../contexts/AskMateContext";
import FMateShortIcon from "../assets/fmate-short-icon.svg";


export function AskMateTrigger({
    accentColor = "#A855F7",
    triggerLabel = "Ask Mate",
}: {
    accentColor?: string;
    triggerLabel?: string;
}) {
    const { open, setOpen } = useAskMate();

    return (
        <button
            onClick={() => setOpen(!open)}
            className="h-9 px-4 rounded-full  text-sm font-semibold flex items-center gap-2 border-2"
            style={{ borderColor: accentColor }}
        >
            <FMateShortIcon />
            {triggerLabel}
        </button>
    );
}