import { createContext, useContext, useState, type ReactNode } from "react";

type AskMateContextType = {
    open: boolean;
    setOpen: (v: boolean) => void;
};

const AskMateContext = createContext<AskMateContextType>({
    open: false,
    setOpen: () => { },
});

export function AskMateProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <AskMateContext.Provider value={{ open, setOpen }}>
            {children}
        </AskMateContext.Provider>
    );
}

export const useAskMate = () => useContext(AskMateContext);