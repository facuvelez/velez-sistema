
import * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumberForDisplay, parseFormattedNumber } from "@/utils/numberFormatter"

interface FormattedInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  formatNumbers?: boolean;
}

const FormattedInput = React.forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ className, type, value, onChange, formatNumbers = false, onBlur, onFocus, onWheel, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      formatNumbers && typeof value === 'number' ? formatNumberForDisplay(value) : String(value)
    );
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(
          formatNumbers && typeof value === 'number' ? formatNumberForDisplay(value) : String(value)
        );
      }
    }, [value, formatNumbers, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (formatNumbers) {
        // Show raw number when focused
        setDisplayValue(String(value));
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (formatNumbers) {
        // Format number when blurred
        const numValue = parseFormattedNumber(displayValue);
        setDisplayValue(formatNumberForDisplay(numValue));
        onChange(numValue);
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setDisplayValue(newValue);
      
      if (formatNumbers) {
        const numValue = parseFormattedNumber(newValue);
        onChange(numValue);
      } else {
        onChange(parseFloat(newValue) || 0);
      }
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent scroll wheel increment/decrement on number inputs
      if (type === "number" || formatNumbers) {
        e.currentTarget.blur();
      }
      onWheel?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={handleWheel}
        {...props}
      />
    )
  }
)
FormattedInput.displayName = "FormattedInput"

export { FormattedInput }
