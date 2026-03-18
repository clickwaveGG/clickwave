"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSITION = {
  type: "spring" as const,
  bounce: 0.1,
  duration: 0.4,
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
  label?: string;
}

export function FloatingSelect({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  className,
  label,
}: FloatingSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const uniqueId = React.useId();

  const selectedOption = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
    <MotionConfig transition={TRANSITION}>
      <div ref={containerRef} className={cn("relative", className)}>
        <motion.button
          type="button"
          layoutId={`fsel-trigger-${uniqueId}`}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
            "bg-white/[0.04] border-white/10",
            "hover:bg-white/[0.06] hover:border-white/20 transition-colors",
            isOpen && "border-brand-orange/40 bg-white/[0.06]",
            !selectedOption && "text-white/30",
            selectedOption && "text-white"
          )}
          whileTap={{ scale: 0.98 }}
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
            <>
              {/* Backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
              />
              <motion.div
                layoutId={`fsel-trigger-${uniqueId}`}
                className={cn(
                  "absolute z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-xl",
                  "border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl",
                  "shadow-2xl shadow-black/40"
                )}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
              >
                {/* Header */}
                {label && (
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-white/30">
                    {label}
                  </p>
                )}

                {/* Options */}
                <div className="max-h-[220px] overflow-y-auto py-1">
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
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                          isSelected
                            ? "text-brand-orange"
                            : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                        )}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                            isSelected
                              ? "border-brand-orange bg-brand-orange/20"
                              : "border-white/10"
                          )}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className="w-2.5 h-2.5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        <span className="truncate">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
