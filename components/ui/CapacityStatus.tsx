"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Story 3.1 AC1: Never show exact capacity numbers to users
export interface CapacityStatusProps {
  status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
  message: string;
  messageEn: string;
  canRegisterFree: boolean;
  canRegisterAdvanced: boolean;
  showDisabledState: boolean;
  sessionTime: "MORNING" | "AFTERNOON";
  className?: string;
}

/**
 * CapacityStatus Component - Story 3.1 AC1 Compliant
 * Displays availability status without exposing exact capacity numbers
 */
export function CapacityStatus({
  status,
  message,
  messageEn,
  canRegisterFree,
  canRegisterAdvanced,
  showDisabledState,
  sessionTime,
  className,
}: CapacityStatusProps) {
  // Status indicator styling based on availability
  const getStatusColor = () => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200";
      case "LIMITED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FULL":
        return "bg-red-100 text-red-800 border-red-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Status icon based on availability
  const getStatusIcon = () => {
    switch (status) {
      case "AVAILABLE":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "LIMITED":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "FULL":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "CLOSED":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
        getStatusColor(),
        showDisabledState && "opacity-50", // Story 3.1 AC1: Show disabled/transparent states
        className
      )}
      role="status"
      aria-label={`Session ${sessionTime.toLowerCase()} availability: ${messageEn}`}
    >
      {getStatusIcon()}
      <span className="font-medium">{message}</span>
    </div>
  );
}

/**
 * Package-specific availability indicator (Story 3.1 AC1)
 */
export interface PackageAvailabilityProps {
  packageType: "FREE" | "ADVANCED";
  canRegister: boolean;
  message: string;
  showDisabledState: boolean;
  className?: string;
}

export function PackageAvailability({
  packageType,
  canRegister,
  message,
  showDisabledState,
  className,
}: PackageAvailabilityProps) {
  const packageColor = packageType === "FREE" ? "blue" : "purple";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm",
        canRegister
          ? `bg-${packageColor}-50 text-${packageColor}-700 border-${packageColor}-200`
          : `bg-gray-50 text-gray-500 border-gray-200`,
        showDisabledState && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          canRegister
            ? `bg-${packageColor}-500`
            : "bg-gray-400"
        )}
      />
      <span className="font-medium">
        {packageType === "FREE" ? "Free Package" : "Advanced Package"}
      </span>
      <span className="text-xs opacity-75">{message}</span>
    </div>
  );
}

/**
 * Session availability display that combines status and package info
 * Implements Story 3.1 AC1: No exact numbers, only availability messaging
 */
export interface SessionAvailabilityDisplayProps {
  sessionTime: "MORNING" | "AFTERNOON";
  displayTime: string;
  displayTimeThai: string;
  availability: {
    status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
    message: string;
    messageEn: string;
    canRegisterFree: boolean;
    canRegisterAdvanced: boolean;
    showDisabledState: boolean;
  };
  onSessionSelect?: (sessionTime: "MORNING" | "AFTERNOON") => void;
  isSelected?: boolean;
  className?: string;
}

export function SessionAvailabilityDisplay({
  sessionTime,
  displayTime,
  displayTimeThai,
  availability,
  onSessionSelect,
  isSelected = false,
  className,
}: SessionAvailabilityDisplayProps) {
  const isDisabled = availability.showDisabledState;

  return (
    <div
      className={cn(
        "p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 border-blue-300",
        isDisabled && "opacity-50 cursor-not-allowed hover:shadow-none",
        !isDisabled && !isSelected && "hover:border-gray-300",
        className
      )}
      onClick={() => !isDisabled && onSessionSelect?.(sessionTime)}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
          e.preventDefault();
          onSessionSelect?.(sessionTime);
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{displayTimeThai}</h3>
          <p className="text-gray-600 text-sm">{displayTime}</p>
        </div>
        <CapacityStatus
          status={availability.status}
          message={availability.message}
          messageEn={availability.messageEn}
          canRegisterFree={availability.canRegisterFree}
          canRegisterAdvanced={availability.canRegisterAdvanced}
          showDisabledState={availability.showDisabledState}
          sessionTime={sessionTime}
        />
      </div>

      <div className="space-y-2">
        <PackageAvailability
          packageType="FREE"
          canRegister={availability.canRegisterFree}
          message={availability.canRegisterFree ? "สามารถสมัครได้" : "เต็มแล้ว"}
          showDisabledState={!availability.canRegisterFree}
        />
        <PackageAvailability
          packageType="ADVANCED"
          canRegister={availability.canRegisterAdvanced}
          message={availability.canRegisterAdvanced ? "สามารถสมัครได้" : "เต็มแล้ว"}
          showDisabledState={!availability.canRegisterAdvanced}
        />
      </div>

      {/* Additional messaging for user guidance */}
      {!availability.canRegisterFree && availability.canRegisterAdvanced && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          พิจารณาอัปเกรดเป็น Advanced Package เพื่อเข้าร่วมสอบในช่วงเวลานี้
        </div>
      )}
    </div>
  );
}