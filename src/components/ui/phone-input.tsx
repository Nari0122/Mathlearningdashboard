"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPhoneDigits, formatPhoneDisplay, PHONE_MAX_LENGTH } from "@/lib/phone";

export interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
    value: string;
    onChange: (value: string) => void;
}

/**
 * 전화번호 전용 입력 필드.
 * - 숫자만 입력 가능, 최대 11자리.
 * - 표시는 000-0000-0000 형식으로 하이픈 자동 삽입.
 * - onChange에는 숫자만 담긴 문자열(최대 11자)이 전달됨.
 */
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        const digits = getPhoneDigits(value);
        const displayValue = formatPhoneDisplay(value);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = getPhoneDigits(e.target.value);
            if (next.length <= PHONE_MAX_LENGTH) {
                onChange(next);
            }
        };

        return (
            <Input
                ref={ref}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={displayValue}
                onChange={handleChange}
                placeholder="010-0000-0000"
                maxLength={13}
                className={cn(className)}
                {...props}
            />
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
