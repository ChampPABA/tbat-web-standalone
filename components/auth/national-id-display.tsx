"use client";

import * as React from "react";
import { formatNationalIdForDisplay, formatNationalIdForAdmin } from "@/lib/national-id-display";

interface NationalIdDisplayProps {
  nationalId: string | null | undefined;
  context?: 'user-profile' | 'admin-dashboard' | 'email-template' | 'summary';
  hasAdminAccess?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function NationalIdDisplay({
  nationalId,
  context = 'user-profile',
  hasAdminAccess = false,
  className = "",
  label = "เลขบัตรประชาชน",
  showLabel = true
}: NationalIdDisplayProps) {
  const getDisplayValue = () => {
    switch (context) {
      case 'admin-dashboard':
        return formatNationalIdForAdmin(nationalId, hasAdminAccess);
      case 'user-profile':
      case 'email-template':
      case 'summary':
      default:
        return formatNationalIdForDisplay(nationalId);
    }
  };

  const displayValue = getDisplayValue();
  const isNotSpecified = displayValue === 'ไม่ได้ระบุ';
  const isAccessDenied = displayValue === 'ไม่มีสิทธิ์เข้าถึง';

  const getDisplayClasses = () => {
    let baseClasses = "font-mono";

    if (isNotSpecified) {
      baseClasses += " text-gray-500 italic";
    } else if (isAccessDenied) {
      baseClasses += " text-red-500 italic";
    } else {
      baseClasses += " text-gray-900";
    }

    return `${baseClasses} ${className}`;
  };

  if (context === 'summary' || !showLabel) {
    return (
      <span className={getDisplayClasses()} role="text">
        {displayValue}
      </span>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
      <span className="text-gray-600 text-sm">{label}:</span>
      <span className={getDisplayClasses()} role="text">
        {displayValue}
      </span>
    </div>
  );
}

interface NationalIdFieldProps {
  nationalId: string | null | undefined;
  isEditable?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function NationalIdField({
  nationalId,
  isEditable = false,
  onEdit,
  className = ""
}: NationalIdFieldProps) {
  const displayValue = formatNationalIdForDisplay(nationalId);
  const isNotSpecified = displayValue === 'ไม่ได้ระบุ';

  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            เลขบัตรประชาชน
          </h3>
          <p className={`text-sm ${isNotSpecified ? 'text-gray-500 italic' : 'text-gray-900 font-mono'}`}>
            {displayValue}
          </p>
        </div>
        {isEditable && (
          <button
            onClick={onEdit}
            className="text-tbat-primary hover:text-tbat-secondary text-sm font-medium transition-colors"
            aria-label="แก้ไขเลขบัตรประชาชน"
          >
            แก้ไข
          </button>
        )}
      </div>
    </div>
  );
}

interface NationalIdSummaryRowProps {
  nationalId: string | null | undefined;
  className?: string;
}

export function NationalIdSummaryRow({
  nationalId,
  className = ""
}: NationalIdSummaryRowProps) {
  // Only show if National ID is provided
  if (!nationalId) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between gap-1 ${className}`}>
      <span className="text-gray-600">เลขบัตรประชาชน:</span>
      <span className="font-medium font-mono">
        <NationalIdDisplay nationalId={nationalId} showLabel={false} />
      </span>
    </div>
  );
}

interface NationalIdBadgeProps {
  nationalId: string | null | undefined;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function NationalIdBadge({
  nationalId,
  variant = 'default',
  className = ""
}: NationalIdBadgeProps) {
  if (!nationalId) {
    return null;
  }

  const displayValue = formatNationalIdForDisplay(nationalId);

  if (variant === 'icon-only') {
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 ${className}`}
        title={`เลขบัตรประชาชน: ${displayValue}`}
      >
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        <span className="sr-only">มีเลขบัตรประชาชน</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 font-mono ${className}`}>
        {displayValue}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
      <span className="text-xs text-blue-600 mr-2">ID:</span>
      <span className="font-mono">{displayValue}</span>
    </div>
  );
}