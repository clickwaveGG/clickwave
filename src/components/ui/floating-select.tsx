"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/fancy-select";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  icon?: LucideIcon;
}

export function FloatingSelect({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  className,
  icon,
}: FloatingSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <div className={cn("w-full", className)}>
        <SelectTrigger
          placeholder={placeholder}
          icon={icon}
          className="w-full"
        />
      </div>
      <SelectContent>
        {options.map((option, idx) => (
          <SelectItem key={option.value} value={option.value} index={idx}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
