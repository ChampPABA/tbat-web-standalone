/**
 * Thai National ID Validation Utilities
 * Implements the official Thai National ID checksum algorithm
 */

export interface NationalIdValidationResult {
  isValid: boolean;
  error?: 'INVALID_LENGTH' | 'INVALID_FIRST_DIGIT' | 'INVALID_CHECKSUM' | 'INVALID_FORMAT';
  formattedId?: string;
}

/**
 * Validates Thai National ID using the official checksum algorithm
 * @param id - National ID string (can include formatting)
 * @returns Validation result with formatted ID if valid
 */
export function validateThaiNationalId(id: string): NationalIdValidationResult {
  // Remove any formatting (dashes, spaces)
  const cleanId = id.replace(/[^0-9]/g, '');

  // Check length
  if (cleanId.length !== 13) {
    return { isValid: false, error: 'INVALID_LENGTH' };
  }

  // Check if all characters are digits
  if (!/^[0-9]{13}$/.test(cleanId)) {
    return { isValid: false, error: 'INVALID_FORMAT' };
  }

  // Check if first digit is 0 (invalid for Thai National ID)
  if (cleanId.charAt(0) === '0') {
    return { isValid: false, error: 'INVALID_FIRST_DIGIT' };
  }

  // Calculate checksum using Thai National ID algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i)) * (13 - i);
  }

  // Calculate check digit
  const remainder = sum % 11;
  const checkDigit = (11 - remainder) % 10;

  // Validate against the 13th digit
  const providedCheckDigit = parseInt(cleanId.charAt(12));

  if (checkDigit === providedCheckDigit) {
    return { isValid: true, formattedId: formatNationalId(cleanId) };
  } else {
    return { isValid: false, error: 'INVALID_CHECKSUM' };
  }
}

/**
 * Formats Thai National ID to standard XXX-XXXXX-XX-X pattern
 * @param id - Clean 13-digit National ID
 * @returns Formatted National ID string
 */
export function formatNationalId(id: string): string {
  // Remove any non-numeric characters
  const clean = id.replace(/[^0-9]/g, '');

  if (clean.length === 13) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 8)}-${clean.substring(8, 10)}-${clean.substring(10, 13)}`;
  }

  return clean;
}

/**
 * Cleans National ID by removing formatting characters
 * @param id - National ID with or without formatting
 * @returns Clean numeric string
 */
export function cleanNationalId(id: string): string {
  return id.replace(/[^0-9]/g, '');
}

/**
 * Gets Thai error message for National ID validation errors
 * @param error - Error code from validation
 * @returns Thai language error message
 */
export function getNationalIdErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    INVALID_LENGTH: 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณากรอกตัวเลข 13 หลัก',
    INVALID_FORMAT: 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณากรอกเฉพาะตัวเลข',
    INVALID_FIRST_DIGIT: 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง หลักแรกต้องไม่เป็น 0',
    INVALID_CHECKSUM: 'เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    DUPLICATE_ID: 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาติดต่อฝ่ายสนับสนุน',
    NETWORK_ERROR: 'ไม่สามารถตรวจสอบเลขบัตรประชาชนได้ กรุณาลองใหม่อีกครั้ง',
    SYSTEM_MAINTENANCE: 'ระบบตรวจสอบเลขบัตรประชาชนอยู่ในช่วงปรับปรุง',
    RATE_LIMIT: 'มีการตรวจสอบเลขบัตรประชาชนเกินขีดจำกัด กรุณารอสักครู่'
  };

  return errorMessages[error] || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

/**
 * Validates if National ID is properly formatted (for display purposes)
 * @param id - National ID string
 * @returns True if formatted as XXX-XXXXX-XX-X pattern
 */
export function isFormattedNationalId(id: string): boolean {
  const formattedPattern = /^\d{3}-\d{5}-\d{2}-\d{3}$/;
  return formattedPattern.test(id);
}

/**
 * Progressive formatting for National ID input (real-time)
 * @param value - Current input value
 * @returns Progressively formatted string
 */
export function progressiveFormatNationalId(value: string): string {
  const clean = value.replace(/[^0-9]/g, '');

  if (clean.length <= 3) {
    return clean;
  } else if (clean.length <= 8) {
    return `${clean.substring(0, 3)}-${clean.substring(3)}`;
  } else if (clean.length <= 10) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 8)}-${clean.substring(8)}`;
  } else {
    return `${clean.substring(0, 3)}-${clean.substring(3, 8)}-${clean.substring(8, 10)}-${clean.substring(10, 13)}`;
  }
}