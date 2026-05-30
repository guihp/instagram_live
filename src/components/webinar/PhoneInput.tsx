import { forwardRef, useCallback } from "react";

import { Input } from "@/components/ui/input";
import {
  formatPhone,
  type PhoneRegion,
  validatePhone,
} from "@/lib/webinar/phone";

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, "type" | "onChange"> {
  region: PhoneRegion;
  onChange: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput({ region, value = "", onChange, onBlur, ...props }, ref) {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(formatPhone(e.target.value, region));
      },
      [onChange, region],
    );

    const placeholder = region === "US" ? "(555) 123-4567" : "(11) 9 1234-5678";

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        {...props}
      />
    );
  },
);

export function phoneZodValidator(region: PhoneRegion) {
  return (value: string) => validatePhone(value, region);
}
