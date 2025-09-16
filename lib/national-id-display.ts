/**
 * National ID Display Utilities
 * Handles consistent display formatting across the TBAT platform
 */

import { formatNationalId, cleanNationalId, isFormattedNationalId } from './national-id-validation';

/**
 * Display configuration for National ID across different contexts
 */
export interface NationalIdDisplayConfig {
  showFullId: boolean;
  format: 'formatted' | 'clean';
  context: 'user-profile' | 'admin-dashboard' | 'email-template' | 'system-log';
}

/**
 * Gets the appropriate display format for National ID based on context and access level
 * @param nationalId - The National ID to display
 * @param config - Display configuration
 * @returns Formatted National ID string for display
 */
export function getDisplayNationalId(
  nationalId: string | null | undefined,
  config: NationalIdDisplayConfig
): string | null {
  if (!nationalId) {
    return null;
  }

  // Always show full formatted ID as per story requirements
  if (config.format === 'formatted') {
    return isFormattedNationalId(nationalId)
      ? nationalId
      : formatNationalId(nationalId);
  }

  // Return clean format if requested
  return cleanNationalId(nationalId);
}

/**
 * Creates a user-friendly display string for National ID
 * @param nationalId - National ID string
 * @returns Formatted string for UI display
 */
export function formatNationalIdForDisplay(nationalId: string | null | undefined): string {
  if (!nationalId) {
    return 'ไม่ได้ระบุ';
  }

  return getDisplayNationalId(nationalId, {
    showFullId: true,
    format: 'formatted',
    context: 'user-profile'
  }) || 'ไม่ได้ระบุ';
}

/**
 * Creates National ID display for email templates
 * @param nationalId - National ID string
 * @returns Formatted National ID for email display
 */
export function formatNationalIdForEmail(nationalId: string | null | undefined): string {
  if (!nationalId) {
    return 'ไม่ได้ระบุ';
  }

  const formatted = getDisplayNationalId(nationalId, {
    showFullId: true,
    format: 'formatted',
    context: 'email-template'
  });

  return formatted || 'ไม่ได้ระบุ';
}

/**
 * Creates National ID display for admin dashboard
 * @param nationalId - National ID string
 * @param hasAdminAccess - Whether user has admin access
 * @returns Formatted National ID for admin display
 */
export function formatNationalIdForAdmin(
  nationalId: string | null | undefined,
  hasAdminAccess: boolean = false
): string {
  if (!nationalId) {
    return 'ไม่ได้ระบุ';
  }

  if (!hasAdminAccess) {
    return 'ไม่มีสิทธิ์เข้าถึง';
  }

  const formatted = getDisplayNationalId(nationalId, {
    showFullId: true,
    format: 'formatted',
    context: 'admin-dashboard'
  });

  return formatted || 'ไม่ได้ระบุ';
}

/**
 * Creates National ID display for system logs
 * @param nationalId - National ID string
 * @returns Clean National ID for system logging
 */
export function formatNationalIdForLog(nationalId: string | null | undefined): string {
  if (!nationalId) {
    return 'null';
  }

  return cleanNationalId(nationalId);
}

/**
 * Validates and formats National ID for consistent storage
 * @param nationalId - Input National ID
 * @returns Clean National ID for database storage
 */
export function normalizeNationalIdForStorage(nationalId: string | null | undefined): string | null {
  if (!nationalId) {
    return null;
  }

  const clean = cleanNationalId(nationalId);
  return clean.length === 13 ? clean : null;
}

/**
 * Gets placeholder text for National ID input field
 * @returns Thai placeholder text
 */
export function getNationalIdPlaceholder(): string {
  return 'เลขบัตรประชาชน 13 หลัก';
}

/**
 * Gets aria-label for National ID input field
 * @returns Thai aria-label for accessibility
 */
export function getNationalIdAriaLabel(): string {
  return 'หมายเลขบัตรประจำตัวประชาชน 13 หลัก';
}

/**
 * Gets help text for National ID input field
 * @returns Thai help text
 */
export function getNationalIdHelpText(): string {
  return 'กรุณากรอกเลขบัตรประชาชน 13 หลัก (เช่น 1234567890123)';
}

/**
 * Creates National ID label with required indicator
 * @param required - Whether field is required
 * @returns Thai label text
 */
export function getNationalIdLabel(required: boolean = false): string {
  const baseLabel = 'เลขบัตรประชาชน';
  return required ? `${baseLabel} *` : baseLabel;
}