import { NextRequest, NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * API Validation Middleware using Zod
 * Provides consistent validation and error handling for API routes
 */

// Initialize DOMPurify with JSDOM for Node.js environment
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// Common validation schemas
export const commonSchemas = {
  // Email validation
  email: z.string().email("Invalid email format / รูปแบบอีเมลไม่ถูกต้อง"),

  // Thai phone number validation (10 digits)
  thaiPhone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits / เบอร์โทรต้องเป็นตัวเลข 10 หลัก"),

  // Strong password validation (simplified for Thai users)
  password: z
    .string()
    .min(8, "Password must be at least 8 characters / รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[a-zA-Z]/, "Password must contain letters / รหัสผ่านต้องมีตัวอักษร")
    .regex(/[0-9]/, "Password must contain numbers / รหัสผ่านต้องมีตัวเลข"),

  // Thai name validation
  thaiName: z
    .string()
    .min(2, "Name too short / ชื่อสั้นเกินไป")
    .max(100, "Name too long / ชื่อยาวเกินไป")
    .refine(
      (val) => /^[ก-๙a-zA-Z\s.]+$/.test(val),
      "Name can only contain Thai/English letters / ชื่อต้องเป็นภาษาไทยหรืออังกฤษเท่านั้น"
    ),

  // MongoDB ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),

  // UUID validation
  uuid: z.string().uuid("Invalid UUID format"),

  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),

  // Date range
  dateRange: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: "End date must be after start date",
    }),

  // PDPA consent
  pdpaConsent: z.boolean().refine((val) => val === true, {
    message: "PDPA consent is required",
  }),
};

// Extended validation schemas for comprehensive input validation
export const extendedSchemas = {
  // School name with Thai support
  schoolName: z
    .string()
    .min(3, "School name too short / ชื่อโรงเรียนสั้นเกินไป")
    .max(200, "School name too long / ชื่อโรงเรียนยาวเกินไป")
    .transform((val) => purify.sanitize(val)),

  // Exam subject validation
  examSubject: z.enum(["BIOLOGY", "CHEMISTRY", "PHYSICS"], {
    message: "Invalid subject / วิชาไม่ถูกต้อง",
  }),

  // Score validation (0-100)
  examScore: z
    .number()
    .min(0, "Score cannot be negative / คะแนนต้องไม่ติดลบ")
    .max(100, "Score cannot exceed 100 / คะแนนต้องไม่เกิน 100")
    .int("Score must be whole number / คะแนนต้องเป็นจำนวนเต็ม"),

  // Payment amount in THB
  paymentAmount: z
    .number()
    .positive("Amount must be positive / จำนวนเงินต้องเป็นบวก")
    .multipleOf(0.01, "Invalid amount format / รูปแบบจำนวนเงินไม่ถูกต้อง")
    .max(100000, "Amount too large / จำนวนเงินมากเกินไป"),

  // Exam code pattern validation
  examCode: z
    .string()
    .refine(
      (val) => /^(FREE-[A-Z0-9]{8}-(BIOLOGY|CHEMISTRY|PHYSICS)|ADV-[A-Z0-9]{8})$/.test(val),
      "Invalid exam code format / รูปแบบรหัสสอบไม่ถูกต้อง"
    ),

  // Session capacity ID
  sessionCapacityId: z
    .string()
    .uuid("Invalid session ID / รหัสเซสชันไม่ถูกต้อง"),

  // Thai citizen ID (13 digits)
  thaiCitizenId: z
    .string()
    .regex(/^[0-9]{13}$/, "Thai ID must be 13 digits / เลขบัตรประชาชนต้องเป็น 13 หลัก")
    .optional(),
};

// Validation schemas for specific endpoints
export const apiSchemas = {
  // User registration schema
  registerUser: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    thaiName: commonSchemas.thaiName,
    phone: commonSchemas.thaiPhone,
    school: extendedSchemas.schoolName,
    packageType: z.enum(["FREE", "ADVANCED"]),
    pdpaConsent: commonSchemas.pdpaConsent,
  }).transform((data) => ({
    ...data,
    thaiName: purify.sanitize(data.thaiName),
    school: purify.sanitize(data.school),
  })),

  // User update schema
  updateUser: z.object({
    thaiName: commonSchemas.thaiName.optional(),
    phone: commonSchemas.thaiPhone.optional(),
    school: extendedSchemas.schoolName.optional(),
    targetMedicalSchool: z.string().max(200).optional(),
  }).transform((data) => {
    const sanitized: any = {};
    if (data.thaiName) sanitized.thaiName = purify.sanitize(data.thaiName);
    if (data.school) sanitized.school = purify.sanitize(data.school);
    if (data.targetMedicalSchool) sanitized.targetMedicalSchool = purify.sanitize(data.targetMedicalSchool);
    if (data.phone) sanitized.phone = data.phone;
    return sanitized;
  }),

  // Exam code generation with subject validation
  generateExamCode: z.object({
    packageType: z.enum(["FREE", "ADVANCED"]),
    subject: extendedSchemas.examSubject.optional(),
    sessionCapacityId: extendedSchemas.sessionCapacityId.optional(),
  }).refine(
    (data) => {
      if (data.packageType === "FREE" && !data.subject) {
        return false;
      }
      if (data.packageType === "ADVANCED" && data.subject) {
        return false;
      }
      return true;
    },
    {
      message: "FREE package requires subject, ADVANCED package must not have subject / แพ็กเกจฟรีต้องระบุวิชา แพ็กเกจขั้นสูงไม่ต้องระบุวิชา",
    }
  ),

  // Payment creation
  createPayment: z.object({
    packageType: z.enum(["FREE", "ADVANCED"]),
    amount: z.number().positive(),
    currency: z.literal("THB"),
  }),

  // Exam submission with validation
  submitExam: z.object({
    examCode: extendedSchemas.examCode,
    subject: extendedSchemas.examSubject,
    answers: z
      .array(
        z.object({
          questionId: z.string().uuid(),
          answer: z.enum(["A", "B", "C", "D", "E"]),
          timeSpent: z.number().int().min(0).max(300), // Max 5 minutes per question
        })
      )
      .min(1, "At least one answer required / ต้องมีคำตอบอย่างน้อย 1 ข้อ")
      .max(100, "Too many answers / คำตอบมากเกินไป"),
    totalTimeSpent: z
      .number()
      .int()
      .min(60, "Exam too short / เวลาสอบน้อยเกินไป")
      .max(10800, "Exam time exceeded / เวลาสอบเกินกำหนด"), // Max 3 hours
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
  }).refine(
    (data) => {
      const start = new Date(data.startedAt);
      const end = new Date(data.completedAt);
      return end > start;
    },
    {
      message: "Completion time must be after start time / เวลาส่งต้องมาหลังเวลาเริ่ม",
    }
  ),

  // Support ticket creation
  createTicket: z.object({
    subject: z.string().min(5).max(200),
    message: z.string().min(10).max(5000),
    category: z.enum(["TECHNICAL", "PAYMENT", "EXAM", "ACCOUNT", "OTHER"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  }),
};

/**
 * Validation error response formatter
 */
function formatValidationErrors(error: ZodError): any {
  const formattedErrors: Record<string, string[]> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(issue.message);
  });

  return {
    error: "Validation failed",
    message: "Please check the errors and try again",
    errors: formattedErrors,
    _raw: error.issues, // Include raw errors for debugging
  };
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(formatValidationErrors(error), { status: 400 }),
      };
    }

    return {
      data: null,
      error: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, any> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., ?id=1&id=2)
      if (query[key]) {
        if (Array.isArray(query[key])) {
          query[key].push(value);
        } else {
          query[key] = [query[key], value];
        }
      } else {
        // Try to parse numbers and booleans
        if (value === "true") query[key] = true;
        else if (value === "false") query[key] = false;
        else if (!isNaN(Number(value))) query[key] = Number(value);
        else query[key] = value;
      }
    });

    const data = schema.parse(query);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(formatValidationErrors(error), { status: 400 }),
      };
    }

    return {
      data: null,
      error: NextResponse.json({ error: "Invalid query parameters" }, { status: 400 }),
    };
  }
}

/**
 * Middleware wrapper that validates request against a schema
 */
export function withValidation<T>(
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
  schema: ZodSchema<T>,
  type: "body" | "query" = "body"
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const validation =
      type === "body" ? await validateBody(req, schema) : validateQuery(req, schema);

    if (validation.error) {
      return validation.error;
    }

    return handler(req, validation.data);
  };
}

/**
 * Combined validation for both body and query
 */
export function withFullValidation<B, Q>(
  handler: (req: NextRequest, body: B, query: Q) => Promise<NextResponse>,
  bodySchema: ZodSchema<B>,
  querySchema: ZodSchema<Q>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Validate query parameters
    const queryValidation = validateQuery(req, querySchema);
    if (queryValidation.error) {
      return queryValidation.error;
    }

    // Validate request body
    const bodyValidation = await validateBody(req, bodySchema);
    if (bodyValidation.error) {
      return bodyValidation.error;
    }

    return handler(req, bodyValidation.data, queryValidation.data);
  };
}

/**
 * Sanitize user input using DOMPurify to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize HTML content with allowed tags
 */
export function sanitizeHTML(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Validate and sanitize Thai language input
 */
export function validateThaiInput(input: string): {
  isValid: boolean;
  hasThai: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeInput(input);
  const thaiRegex = /[\u0E00-\u0E7F]/;
  const hasThai = thaiRegex.test(sanitized);
  
  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /alert\(/i,
  ];
  
  const isValid = !maliciousPatterns.some(pattern => pattern.test(input));
  
  return {
    isValid,
    hasThai,
    sanitized,
  };
}

/**
 * Validate file upload
 */
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ], {
    message: "Invalid file type / ประเภทไฟล์ไม่ถูกต้อง",
  }),
  size: z
    .number()
    .max(10 * 1024 * 1024, "File too large (max 10MB) / ไฟล์ใหญ่เกินไป (สูงสุด 10MB)"),
});

/**
 * API Error Response with Thai support
 */
export function createErrorResponse(
  message: string,
  messageThai?: string,
  statusCode: number = 400
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      errorThai: messageThai || message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Success Response with Thai support
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  messageThai?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    messageThai,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * PDPA compliance checker
 */
export interface PDPAValidation {
  hasConsent: boolean;
  consentDate?: Date;
  consentVersion?: string;
  dataRetentionDays?: number;
}

export function validatePDPACompliance(validation: PDPAValidation): boolean {
  if (!validation.hasConsent) {
    return false;
  }

  // Check if consent is not expired (1 year)
  if (validation.consentDate) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (validation.consentDate < oneYearAgo) {
      return false;
    }
  }

  return true;
}
