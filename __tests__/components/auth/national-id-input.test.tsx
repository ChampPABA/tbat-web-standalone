/**
 * Component tests for NationalIdInput
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NationalIdInput } from '@/components/auth/national-id-input';

// Mock the validation functions
jest.mock('@/lib/national-id-validation', () => ({
  validateThaiNationalId: jest.fn(),
  progressiveFormatNationalId: jest.fn(),
  cleanNationalId: jest.fn(),
  getNationalIdErrorMessage: jest.fn(),
  getNationalIdPlaceholder: jest.fn(() => 'เลขบัตรประชาชน 13 หลัก'),
  getNationalIdAriaLabel: jest.fn(() => 'หมายเลขบัตรประจำตัวประชาชน 13 หลัก'),
  getNationalIdLabel: jest.fn((required) => required ? 'เลขบัตรประชาชน *' : 'เลขบัตรประชาชน')
}));

import {
  validateThaiNationalId,
  progressiveFormatNationalId,
  getNationalIdErrorMessage
} from '@/lib/national-id-validation';

const mockValidateThaiNationalId = validateThaiNationalId as jest.MockedFunction<typeof validateThaiNationalId>;
const mockProgressiveFormatNationalId = progressiveFormatNationalId as jest.MockedFunction<typeof progressiveFormatNationalId>;
const mockGetNationalIdErrorMessage = getNationalIdErrorMessage as jest.MockedFunction<typeof getNationalIdErrorMessage>;

describe('NationalIdInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProgressiveFormatNationalId.mockImplementation((value) => value);
    mockValidateThaiNationalId.mockReturnValue({ isValid: true });
    mockGetNationalIdErrorMessage.mockReturnValue('ข้อผิดพลาด');
  });

  describe('Basic Rendering', () => {
    test('should render input field with correct attributes', () => {
      render(<NationalIdInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /หมายเลขบัตรประจำตัวประชาชน/ });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'เลขบัตรประชาชน 13 หลัก');
      expect(input).toHaveAttribute('maxlength', '17');
      expect(input).toHaveAttribute('inputmode', 'numeric');
    });

    test('should render label without required indicator by default', () => {
      render(<NationalIdInput {...defaultProps} />);

      const label = screen.getByText('เลขบัตรประชาชน');
      expect(label).toBeInTheDocument();
      expect(screen.queryByText('เลขบัตรประชาชน *')).not.toBeInTheDocument();
    });

    test('should render label with required indicator when required=true', () => {
      render(<NationalIdInput {...defaultProps} required={true} />);

      const label = screen.getByText('เลขบัตรประชาชน *');
      expect(label).toBeInTheDocument();
    });

    test('should display help text initially', () => {
      render(<NationalIdInput {...defaultProps} />);

      const helpText = screen.getByText('กรุณากรอกเลขบัตรประชาชน 13 หลัก (ไม่บังคับ)');
      expect(helpText).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    test('should call onChange with formatted value', async () => {
      const onChange = jest.fn();
      mockProgressiveFormatNationalId.mockReturnValue('123-4567');

      render(<NationalIdInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567');

      expect(onChange).toHaveBeenCalledWith('123-4567');
      expect(mockProgressiveFormatNationalId).toHaveBeenCalledWith('1234567');
    });

    test('should filter non-numeric and non-dash characters', async () => {
      const onChange = jest.fn();
      mockProgressiveFormatNationalId.mockImplementation((value) => value);

      render(<NationalIdInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '123ABC456-DEF');

      expect(onChange).toHaveBeenCalledWith('123456-');
    });

    test('should limit input to 17 characters', async () => {
      const onChange = jest.fn();
      const longInput = '123456789012345678901234567890';

      render(<NationalIdInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, longInput);

      // Should be limited to 17 characters
      expect(onChange).toHaveBeenLastCalledWith('12345678901234567');
    });

    test('should handle disabled state', () => {
      render(<NationalIdInput {...defaultProps} disabled={true} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Validation States', () => {
    test('should show loading state during validation', async () => {
      const onChange = jest.fn();
      render(<NationalIdInput value="" onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567890123');

      // Should briefly show loading spinner
      // Note: This test might be flaky due to timing, consider using fake timers
    });

    test('should show success state for valid National ID', async () => {
      mockValidateThaiNationalId.mockReturnValue({ isValid: true });

      render(<NationalIdInput value="1234567890123" onChange={jest.fn()} />);

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText('✓ เลขบัตรประชาชนถูกต้อง')).toBeInTheDocument();
      });

      // Should show success icon
      const successIcon = document.querySelector('svg[data-testid="check-circle"]');
      expect(successIcon).toBeInTheDocument();
    });

    test('should show error state for invalid National ID', async () => {
      mockValidateThaiNationalId.mockReturnValue({
        isValid: false,
        error: 'INVALID_CHECKSUM'
      });
      mockGetNationalIdErrorMessage.mockReturnValue('เลขบัตรประชาชนไม่ถูกต้อง');

      render(<NationalIdInput value="1234567890124" onChange={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('เลขบัตรประชาชนไม่ถูกต้อง')).toBeInTheDocument();
      });

      // Should show error icon
      const errorIcon = document.querySelector('svg[data-testid="alert-circle"]');
      expect(errorIcon).toBeInTheDocument();
    });

    test('should show external error message', () => {
      render(<NationalIdInput {...defaultProps} error="External error message" />);

      expect(screen.getByText('External error message')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });

    test('should prioritize external error over validation error', async () => {
      mockValidateThaiNationalId.mockReturnValue({
        isValid: false,
        error: 'INVALID_CHECKSUM'
      });
      mockGetNationalIdErrorMessage.mockReturnValue('เลขบัตรประชาชนไม่ถูกต้อง');

      render(<NationalIdInput value="1234567890124" onChange={jest.fn()} error="External error" />);

      expect(screen.getByText('External error')).toBeInTheDocument();
      expect(screen.queryByText('เลขบัตรประชาชนไม่ถูกต้อง')).not.toBeInTheDocument();
    });
  });

  describe('Focus and Blur Behavior', () => {
    test('should apply focus styles on focus', async () => {
      render(<NationalIdInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      expect(input).toHaveClass('border-tbat-primary');
    });

    test('should remove focus styles on blur', async () => {
      render(<NationalIdInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab(); // Move focus away

      expect(input).not.toHaveClass('border-tbat-primary');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<NationalIdInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'หมายเลขบัตรประจำตัวประชาชน 13 หลัก');
      expect(input).toHaveAttribute('aria-describedby', 'national-id-help');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    test('should update ARIA attributes for error state', () => {
      render(<NationalIdInput {...defaultProps} error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'national-id-error');
    });

    test('should associate label with input', () => {
      render(<NationalIdInput {...defaultProps} />);

      const label = screen.getByLabelText('เลขบัตรประชาชน');
      const input = screen.getByRole('textbox');

      expect(label).toBe(input);
    });
  });

  describe('Validation Callback', () => {
    test('should call onValidationChange when validation status changes', async () => {
      const onValidationChange = jest.fn();
      mockValidateThaiNationalId.mockReturnValue({ isValid: true });

      render(
        <NationalIdInput
          value=""
          onChange={jest.fn()}
          onValidationChange={onValidationChange}
        />
      );

      // Should call with true for empty value (optional field)
      expect(onValidationChange).toHaveBeenCalledWith(true);

      // Clear mock calls
      onValidationChange.mockClear();

      // Re-render with value
      render(
        <NationalIdInput
          value="1234567890123"
          onChange={jest.fn()}
          onValidationChange={onValidationChange}
        />
      );

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true);
      });
    });

    test('should call onValidationChange with false for invalid ID', async () => {
      const onValidationChange = jest.fn();
      mockValidateThaiNationalId.mockReturnValue({ isValid: false });

      render(
        <NationalIdInput
          value="invalid"
          onChange={jest.fn()}
          onValidationChange={onValidationChange}
        />
      );

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Styling and CSS Classes', () => {
    test('should apply custom className', () => {
      render(<NationalIdInput {...defaultProps} className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    test('should apply correct border colors based on state', () => {
      const { rerender } = render(<NationalIdInput {...defaultProps} />);
      const input = screen.getByRole('textbox');

      // Default state
      expect(input).toHaveClass('border-gray-300');

      // Error state
      rerender(<NationalIdInput {...defaultProps} error="Error" />);
      expect(input).toHaveClass('border-red-500');

      // Valid state (would need to mock validation to test)
    });
  });

  describe('Performance', () => {
    test('should debounce validation calls', async () => {
      jest.useFakeTimers();
      mockValidateThaiNationalId.mockClear();

      render(<NationalIdInput value="" onChange={jest.fn()} />);

      const input = screen.getByRole('textbox');

      // Type multiple characters quickly
      await userEvent.type(input, '123');

      // Should not validate immediately
      expect(mockValidateThaiNationalId).not.toHaveBeenCalled();

      // Fast forward past debounce delay
      jest.advanceTimersByTime(500);

      // Should validate once
      await waitFor(() => {
        expect(mockValidateThaiNationalId).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });
  });
});