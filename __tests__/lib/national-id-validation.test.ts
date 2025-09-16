/**
 * Test suite for Thai National ID validation utilities
 * Tests the official Thai National ID checksum algorithm implementation
 */

import {
  validateThaiNationalId,
  formatNationalId,
  cleanNationalId,
  getNationalIdErrorMessage,
  isFormattedNationalId,
  progressiveFormatNationalId
} from '../../lib/national-id-validation';

describe('validateThaiNationalId', () => {
  describe('Valid National IDs', () => {
    test('should validate a correct Thai National ID', () => {
      const result = validateThaiNationalId('1234567890121');
      expect(result.isValid).toBe(true);
      expect(result.formattedId).toBe('123-45678-90-121');
      expect(result.error).toBeUndefined();
    });

    test('should validate formatted National ID', () => {
      const result = validateThaiNationalId('123-45678-90-121');
      expect(result.isValid).toBe(true);
      expect(result.formattedId).toBe('123-45678-90-121');
    });

    test('should validate National ID with various valid checksums', () => {
      const validIds = [
        '1234567890121', // Valid checksum: 1
        '9876543210989', // Valid checksum: 9
        '1111111111119'  // Valid checksum: 9
      ];

      validIds.forEach(id => {
        const result = validateThaiNationalId(id);
        expect(result.isValid).toBe(true);
        expect(result.formattedId).toBeDefined();
      });
    });
  });

  describe('Invalid National IDs', () => {
    test('should reject National ID with incorrect length', () => {
      const result = validateThaiNationalId('12345678901');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_LENGTH');
    });

    test('should reject National ID starting with 0', () => {
      const result = validateThaiNationalId('0234567890123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_FIRST_DIGIT');
    });

    test('should reject National ID with invalid checksum', () => {
      const result = validateThaiNationalId('1234567890123'); // Wrong checksum
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_CHECKSUM');
    });

    test('should reject National ID with non-numeric characters', () => {
      const result = validateThaiNationalId('123abc7890121');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_LENGTH');
    });

    test('should reject empty string', () => {
      const result = validateThaiNationalId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_LENGTH');
    });

    test('should reject too long National ID', () => {
      const result = validateThaiNationalId('12345678901234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_LENGTH');
    });
  });

  describe('Edge Cases', () => {
    test('should handle National ID with spaces and dashes', () => {
      const result = validateThaiNationalId('123-456-789-012-1');
      expect(result.isValid).toBe(true);
      expect(result.formattedId).toBe('123-45678-90-121');
    });

    test('should handle National ID with mixed formatting', () => {
      const result = validateThaiNationalId('123 456-78901 21');
      expect(result.isValid).toBe(true);
      expect(result.formattedId).toBe('123-45678-90-121');
    });
  });
});

describe('formatNationalId', () => {
  test('should format clean National ID correctly', () => {
    expect(formatNationalId('1234567890121')).toBe('123-45678-90-121');
  });

  test('should format already formatted National ID', () => {
    expect(formatNationalId('123-45678-90-121')).toBe('123-45678-90-121');
  });

  test('should handle partial National ID', () => {
    expect(formatNationalId('12345')).toBe('12345');
  });

  test('should handle empty string', () => {
    expect(formatNationalId('')).toBe('');
  });

  test('should handle non-numeric characters', () => {
    expect(formatNationalId('123abc7890121')).toBe('1237890121');
  });
});

describe('cleanNationalId', () => {
  test('should remove formatting from National ID', () => {
    expect(cleanNationalId('123-45678-90-121')).toBe('1234567890121');
  });

  test('should remove all non-numeric characters', () => {
    expect(cleanNationalId('123-abc-45678-90-121')).toBe('1234567890121');
  });

  test('should handle clean National ID', () => {
    expect(cleanNationalId('1234567890121')).toBe('1234567890121');
  });

  test('should handle empty string', () => {
    expect(cleanNationalId('')).toBe('');
  });
});

describe('getNationalIdErrorMessage', () => {
  test('should return correct Thai error messages', () => {
    expect(getNationalIdErrorMessage('INVALID_LENGTH')).toBe(
      'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง กรุณากรอกตัวเลข 13 หลัก'
    );
    expect(getNationalIdErrorMessage('INVALID_CHECKSUM')).toBe(
      'เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
    );
  });

  test('should return default message for unknown error', () => {
    expect(getNationalIdErrorMessage('UNKNOWN_ERROR')).toBe(
      'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    );
  });
});

describe('isFormattedNationalId', () => {
  test('should detect correctly formatted National ID', () => {
    expect(isFormattedNationalId('123-45678-90-121')).toBe(true);
  });

  test('should reject incorrectly formatted National ID', () => {
    expect(isFormattedNationalId('1234567890121')).toBe(false);
    expect(isFormattedNationalId('123-456-78901-21')).toBe(false);
  });

  test('should handle empty string', () => {
    expect(isFormattedNationalId('')).toBe(false);
  });
});

describe('progressiveFormatNationalId', () => {
  test('should progressively format National ID as user types', () => {
    expect(progressiveFormatNationalId('123')).toBe('123');
    expect(progressiveFormatNationalId('1234')).toBe('123-4');
    expect(progressiveFormatNationalId('12345678')).toBe('123-45678');
    expect(progressiveFormatNationalId('123456789')).toBe('123-45678-9');
    expect(progressiveFormatNationalId('1234567890')).toBe('123-45678-90');
    expect(progressiveFormatNationalId('1234567890121')).toBe('123-45678-90-121');
  });

  test('should handle already formatted input', () => {
    expect(progressiveFormatNationalId('123-45678-90-121')).toBe('123-45678-90-121');
  });

  test('should remove non-numeric characters', () => {
    expect(progressiveFormatNationalId('123abc456')).toBe('123-456');
  });

  test('should handle empty string', () => {
    expect(progressiveFormatNationalId('')).toBe('');
  });
});

describe('Thai National ID Algorithm Verification', () => {
  test('should correctly calculate checksum for known valid IDs', () => {
    const testCases = [
      { id: '1234567890121', expectedValid: true },
      { id: '9876543210989', expectedValid: true },
      { id: '1111111111119', expectedValid: true },
      { id: '1234567890124', expectedValid: false }, // Wrong checksum
      { id: '0234567890123', expectedValid: false }  // Starts with 0
    ];

    testCases.forEach(({ id, expectedValid }) => {
      const result = validateThaiNationalId(id);
      expect(result.isValid).toBe(expectedValid);
    });
  });

  test('should reject all zeros except valid checksum', () => {
    const result = validateThaiNationalId('0000000000000');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INVALID_FIRST_DIGIT');
  });

  test('should validate checksum calculation accuracy', () => {
    // Manual verification of algorithm
    const id = '1234567890121';
    const digits = id.split('').map(d => parseInt(d));

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }

    const remainder = sum % 11;
    const expectedCheckDigit = (11 - remainder) % 10;

    expect(expectedCheckDigit).toBe(digits[12]);

    const result = validateThaiNationalId(id);
    expect(result.isValid).toBe(true);
  });
});

describe('Performance Tests', () => {
  test('should validate National ID quickly', () => {
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      validateThaiNationalId('1234567890121');
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete 1000 validations in under 50ms
    expect(executionTime).toBeLessThan(50);
  });

  test('should handle concurrent validations', async () => {
    const validationPromises = Array.from({ length: 100 }, (_, i) =>
      Promise.resolve(validateThaiNationalId('1234567890121'))
    );

    const results = await Promise.all(validationPromises);

    results.forEach(result => {
      expect(result.isValid).toBe(true);
    });
  });
});