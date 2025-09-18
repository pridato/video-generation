'use client'

import { FC, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
  variant?: 'default' | 'creator'
}

export const Select: FC<SelectProps> = ({
  options,
  placeholder,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none bg-input border border-input rounded-lg px-4 py-3 pr-10 text-foreground transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "hover:border-accent hover:shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variant === 'creator' && [
            "bg-gradient-to-r from-background to-input/50",
            "border-border/50 hover:border-primary/30",
            "focus:border-primary focus:shadow-lg focus:shadow-primary/10",
            "text-foreground font-medium"
          ],
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-background text-foreground py-2"
          >
            {option.label}
          </option>
        ))}
      </select>

      <div className={cn(
        "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors",
        variant === 'creator' ? "text-primary" : "text-muted-foreground"
      )}>
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  )
}