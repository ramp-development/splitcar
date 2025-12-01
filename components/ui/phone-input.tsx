"use client";

import * as React from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";

import "react-phone-number-input/style.css";

export interface PhoneInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof PhoneInputWithCountry>,
    "onChange"
  > {
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<
  React.ElementRef<typeof PhoneInputWithCountry>,
  PhoneInputProps
>(({ className, onChange, ...props }, ref) => {
  return (
    <PhoneInputWithCountry
      ref={ref}
      flags={flags}
      international
      defaultCountry="CA"
      countryCallingCodeEditable={false}
      className={cn("flex gap-2", className)}
      numberInputProps={{
        className:
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      }}
      countrySelectProps={{
        className:
          "flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      }}
      onChange={(value) => onChange?.(value || "")}
      {...props}
    />
  );
});

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
