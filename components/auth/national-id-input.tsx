"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  validateThaiNationalId,
  progressiveFormatNationalId,
  cleanNationalId,
  getNationalIdErrorMessage
} from "@/lib/national-id-validation";
import {
  getNationalIdPlaceholder,
  getNationalIdAriaLabel,
  getNationalIdLabel
} from "@/lib/national-id-display";

interface NationalIdInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function NationalIdInput({
  value,
  onChange,
  error,
  required = false,
  className = "",
  disabled = false,
  onValidationChange
}: NationalIdInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [focused, setFocused] = useState(false);

  // Real-time validation
  useEffect(() => {
    if (!value) {
      setIsValid(null);
      setValidationError("");
      onValidationChange?.(true); // Empty is valid for optional field
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsValidating(true);

      // Validate National ID format and checksum
      const validation = validateThaiNationalId(value);

      if (validation.isValid) {
        setIsValid(true);
        setValidationError("");
      } else {
        setIsValid(false);
        setValidationError(
          validation.error ? getNationalIdErrorMessage(validation.error) : "รูปแบบไม่ถูกต้อง"
        );
      }

      onValidationChange?.(validation.isValid || !value);
      setIsValidating(false);
    }, 500); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Allow only digits and formatting characters
    inputValue = inputValue.replace(/[^\d-]/g, '');

    // Limit to 17 characters (13 digits + 4 dashes)
    if (inputValue.length > 17) {
      inputValue = inputValue.slice(0, 17);
    }

    // Progressive formatting for better UX
    const formatted = progressiveFormatNationalId(inputValue);
    onChange(formatted);
  };

  const getInputBorderClass = () => {
    if (error || validationError) return 'border-red-500 focus:border-red-500';
    if (isValid === true) return 'border-green-500 focus:border-green-500';
    if (focused) return 'border-tbat-primary focus:border-tbat-primary';
    return 'border-gray-300';
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    if (isValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (isValid === false || error || validationError) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="form-field">
      <label htmlFor="national-id" className="block text-sm font-medium text-gray-700 mb-2">
        เลขบัตรประชาชน {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Input
          id="national-id"
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-tbat-primary focus:border-transparent outline-none transition-all ${getInputBorderClass()} ${className}`}
          placeholder={getNationalIdPlaceholder()}
          aria-label={getNationalIdAriaLabel()}
          aria-invalid={!!(error || validationError)}
          aria-describedby={error || validationError ? "national-id-error" : "national-id-help"}
          maxLength={17}
          inputMode="numeric"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {getValidationIcon()}
        </div>
      </div>

      {/* Help text */}
      {!error && !validationError && !isValid && (
        <p id="national-id-help" className="text-xs text-gray-500 mt-1">
          กรุณากรอกเลขบัตรประชาชน 13 หลัก
        </p>
      )}

      {/* Error message */}
      {(error || validationError) && (
        <span id="national-id-error" className="text-xs text-red-500 mt-1 block">
          {error || validationError}
        </span>
      )}

      {/* Success message */}
      {isValid === true && !error && (
        <span className="text-xs text-green-600 mt-1 block">
          ✓ เลขบัตรประชาชนถูกต้อง
        </span>
      )}
    </div>
  );
}