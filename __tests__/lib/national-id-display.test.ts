import {
  getDisplayNationalId,
  formatNationalIdForDisplay,
  formatNationalIdForEmail,
  formatNationalIdForAdmin,
  formatNationalIdForLog,
  normalizeNationalIdForStorage,
  getNationalIdPlaceholder,
  getNationalIdAriaLabel,
  getNationalIdHelpText,
  getNationalIdLabel
} from '@/lib/national-id-display';

describe('getDisplayNationalId', () => {
  test('should return formatted National ID for user profile context', () => {
    const result = getDisplayNationalId('1234567890123', {
      showFullId: true,
      format: 'formatted',
      context: 'user-profile'
    });
    expect(result).toBe('123-45678-90-123');
  });

  test('should return clean National ID when format is clean', () => {
    const result = getDisplayNationalId('123-45678-90-123', {
      showFullId: true,
      format: 'clean',
      context: 'system-log'
    });
    expect(result).toBe('1234567890123');
  });

  test('should handle already formatted National ID', () => {
    const result = getDisplayNationalId('123-45678-90-123', {
      showFullId: true,
      format: 'formatted',
      context: 'user-profile'
    });
    expect(result).toBe('123-45678-90-123');
  });

  test('should return null for null/undefined input', () => {
    expect(getDisplayNationalId(null, {
      showFullId: true,
      format: 'formatted',
      context: 'user-profile'
    })).toBeNull();

    expect(getDisplayNationalId(undefined, {
      showFullId: true,
      format: 'formatted',
      context: 'user-profile'
    })).toBeNull();
  });

  test('should return null for empty string', () => {
    const result = getDisplayNationalId('', {
      showFullId: true,
      format: 'formatted',
      context: 'user-profile'
    });
    expect(result).toBeNull();
  });
});

describe('formatNationalIdForDisplay', () => {
  test('should format National ID for UI display', () => {
    expect(formatNationalIdForDisplay('1234567890123')).toBe('123-45678-90-123');
  });

  test('should return Thai "not specified" message for null', () => {
    expect(formatNationalIdForDisplay(null)).toBe('ไม่ได้ระบุ');
  });

  test('should return Thai "not specified" message for undefined', () => {
    expect(formatNationalIdForDisplay(undefined)).toBe('ไม่ได้ระบุ');
  });

  test('should return Thai "not specified" message for empty string', () => {
    expect(formatNationalIdForDisplay('')).toBe('ไม่ได้ระบุ');
  });

  test('should handle already formatted National ID', () => {
    expect(formatNationalIdForDisplay('123-45678-90-123')).toBe('123-45678-90-123');
  });
});

describe('formatNationalIdForEmail', () => {
  test('should format National ID for email templates', () => {
    expect(formatNationalIdForEmail('1234567890123')).toBe('123-45678-90-123');
  });

  test('should return Thai "not specified" for null', () => {
    expect(formatNationalIdForEmail(null)).toBe('ไม่ได้ระบุ');
  });

  test('should handle formatted National ID', () => {
    expect(formatNationalIdForEmail('123-45678-90-123')).toBe('123-45678-90-123');
  });
});

describe('formatNationalIdForAdmin', () => {
  test('should format National ID for admin dashboard with access', () => {
    expect(formatNationalIdForAdmin('1234567890123', true)).toBe('123-45678-90-123');
  });

  test('should return access denied message without admin access', () => {
    expect(formatNationalIdForAdmin('1234567890123', false)).toBe('ไม่มีสิทธิ์เข้าถึง');
  });

  test('should return access denied message with default access (false)', () => {
    expect(formatNationalIdForAdmin('1234567890123')).toBe('ไม่มีสิทธิ์เข้าถึง');
  });

  test('should return "not specified" for null with admin access', () => {
    expect(formatNationalIdForAdmin(null, true)).toBe('ไม่ได้ระบุ');
  });

  test('should return "not specified" for null without admin access', () => {
    expect(formatNationalIdForAdmin(null, false)).toBe('ไม่ได้ระบุ');
  });
});

describe('formatNationalIdForLog', () => {
  test('should format National ID for system logging', () => {
    expect(formatNationalIdForLog('123-45678-90-123')).toBe('1234567890123');
  });

  test('should handle clean National ID', () => {
    expect(formatNationalIdForLog('1234567890123')).toBe('1234567890123');
  });

  test('should return "null" for null input', () => {
    expect(formatNationalIdForLog(null)).toBe('null');
  });

  test('should return "null" for undefined input', () => {
    expect(formatNationalIdForLog(undefined)).toBe('null');
  });

  test('should return "null" for empty string', () => {
    expect(formatNationalIdForLog('')).toBe('null');
  });
});

describe('normalizeNationalIdForStorage', () => {
  test('should normalize formatted National ID for storage', () => {
    expect(normalizeNationalIdForStorage('123-45678-90-123')).toBe('1234567890123');
  });

  test('should handle clean National ID', () => {
    expect(normalizeNationalIdForStorage('1234567890123')).toBe('1234567890123');
  });

  test('should return null for invalid length', () => {
    expect(normalizeNationalIdForStorage('123456789')).toBeNull();
  });

  test('should return null for null input', () => {
    expect(normalizeNationalIdForStorage(null)).toBeNull();
  });

  test('should return null for undefined input', () => {
    expect(normalizeNationalIdForStorage(undefined)).toBeNull();
  });

  test('should return null for empty string', () => {
    expect(normalizeNationalIdForStorage('')).toBeNull();
  });

  test('should handle National ID with mixed formatting', () => {
    expect(normalizeNationalIdForStorage('123 45678-90.123')).toBe('1234567890123');
  });
});

describe('UI Helper Functions', () => {
  test('getNationalIdPlaceholder should return Thai placeholder', () => {
    expect(getNationalIdPlaceholder()).toBe('เลขบัตรประชาชน 13 หลัก');
  });

  test('getNationalIdAriaLabel should return Thai aria label', () => {
    expect(getNationalIdAriaLabel()).toBe('หมายเลขบัตรประจำตัวประชาชน 13 หลัก');
  });

  test('getNationalIdHelpText should return Thai help text', () => {
    expect(getNationalIdHelpText()).toBe('กรุณากรอกเลขบัตรประชาชน 13 หลัก (เช่น 1234567890123)');
  });

  test('getNationalIdLabel should return correct label', () => {
    expect(getNationalIdLabel(false)).toBe('เลขบัตรประชาชน');
    expect(getNationalIdLabel(true)).toBe('เลขบัตรประชาชน *');
  });

  test('getNationalIdLabel should handle default parameter', () => {
    expect(getNationalIdLabel()).toBe('เลขบัตรประชาชน');
  });
});

describe('Context-Specific Formatting', () => {
  const testNationalId = '1234567890123';

  test('should format consistently across contexts', () => {
    const contexts = ['user-profile', 'admin-dashboard', 'email-template'] as const;

    contexts.forEach(context => {
      const result = getDisplayNationalId(testNationalId, {
        showFullId: true,
        format: 'formatted',
        context
      });
      expect(result).toBe('123-45678-90-123');
    });
  });

  test('should maintain formatting for system logs', () => {
    const result = getDisplayNationalId(testNationalId, {
      showFullId: true,
      format: 'clean',
      context: 'system-log'
    });
    expect(result).toBe('1234567890123');
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle malformed National ID gracefully', () => {
    expect(formatNationalIdForDisplay('invalid-id')).toBe('ไม่ได้ระบุ');
    expect(formatNationalIdForEmail('123-abc-def')).toBe('ไม่ได้ระบุ');
  });

  test('should handle very long input', () => {
    const longInput = '1234567890123456789012345678901234567890';
    expect(normalizeNationalIdForStorage(longInput)).toBeNull();
  });

  test('should handle special characters', () => {
    expect(normalizeNationalIdForStorage('123@#45678$%90123')).toBe('1234567890123');
  });

  test('should handle whitespace-only input', () => {
    expect(formatNationalIdForDisplay('   ')).toBe('ไม่ได้ระบุ');
    expect(normalizeNationalIdForStorage('   ')).toBeNull();
  });
});

describe('Accessibility and Internationalization', () => {
  test('should provide Thai language UI text consistently', () => {
    const uiTexts = [
      getNationalIdPlaceholder(),
      getNationalIdAriaLabel(),
      getNationalIdHelpText(),
      getNationalIdLabel(false),
      formatNationalIdForDisplay(null),
      formatNationalIdForEmail(null)
    ];

    uiTexts.forEach(text => {
      expect(text).toMatch(/[ก-๙]/); // Contains Thai characters
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });
  });

  test('should maintain consistent formatting for accessibility', () => {
    const nationalId = '1234567890123';
    const formatted = '123-45678-90-123';

    expect(formatNationalIdForDisplay(nationalId)).toBe(formatted);
    expect(formatNationalIdForEmail(nationalId)).toBe(formatted);
    expect(formatNationalIdForAdmin(nationalId, true)).toBe(formatted);
  });
});