import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSITION = {
  type: "spring" as const,
  bounce: 0.15,
  duration: 0.35,
};

interface FloatingSelectOption {
  value: string;
  label: string;
}

interface FloatingSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FloatingSelectOption[];
  placeholder?: string;
  className?: string;
}

export function FloatingSelect({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  className,
}: FloatingSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const uniqueId = React.useId();

  const selectedOption = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.button
        type="button"
        layoutId={`floating-select-trigger-${uniqueId}`}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]",
          isOpen && "border-brand-orange/40 bg-white/[0.06]",
          !selectedOption && "text-white/30",
          selectedOption && "text-white"
        )}
      >
        <span className="truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId={`floating-select-content-${uniqueId}`}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={TRANSITION}
            className={cn(
              "absolute z-50 mt-1 w-full min-w-[180px] overflow-hidden rounded-xl",
              "border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl shadow-black/40"
            )}
            style={{ originY: 0 }}
          >
            <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                      isSelected
                        ? "text-brand-orange"
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-brand-orange bg-brand-orange/20"
                          : "border-white/10"
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
