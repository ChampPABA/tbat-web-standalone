import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/monitoring";
import { csrfProtection } from "@/lib/csrf";
import { z } from "zod";

// Query parameters schema
const auditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "action", "resourceType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// GET /api/admin/audit - Retrieve audit logs
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // Check admin authorization
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role - check if user is an admin
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) {
      // Log unauthorized admin access attempt
      await auditLog({
        action: "UNAUTHORIZED_ADMIN_ACCESS",
        userId: session.user.email,
        resourceType: "AuditLog",
        details: {
          endpoint: "/api/admin/audit",
          attemptedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validatedParams = auditQuerySchema.parse(params);
    const { 
      userId, 
      action, 
      resourceType, 
      startDate, 
      endDate, 
      page, 
      limit,
      sortBy,
      sortOrder 
    } = validatedParams;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (resourceType) {
      where.resourceType = resourceType;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch audit logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              thaiName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Log admin data access
    await auditLog({
      action: "ADMIN_DATA_ACCESS",
      userId: adminUser.id,
      resourceType: "AuditLog",
      details: {
        query: validatedParams,
        resultsCount: logs.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
    });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve audit logs" },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit - Create a new audit log entry
export async function POST(req: NextRequest) {
  return csrfProtection(req, async (request) => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);

      // Check admin authorization
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify admin role
      if (!prisma) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 });
      }
      
      const adminUser = await prisma.adminUser.findUnique({
        where: { email: session.user.email },
      });

      if (!adminUser) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Parse request body
      const body = await request.json();
    
    // Validate audit log data
    const auditSchema = z.object({
      actionType: z.enum(["USER_UPDATE", "CODE_REGEN", "PDF_UPLOAD", "CRISIS_RESOLUTION"]),
      targetId: z.string(),
      originalData: z.any().optional(),
      newData: z.any().optional(),
      reason: z.string().min(1).max(500),
    });

    const validatedData = auditSchema.parse(body);

    // Create audit log entry
    const auditLogEntry = await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        actionType: validatedData.actionType,
        targetId: validatedData.targetId,
        originalData: validatedData.originalData || {},
        newData: validatedData.newData || {},
        reason: validatedData.reason,
      },
    });

    return NextResponse.json({
      success: true,
      data: auditLogEntry,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid audit log data", 
            details: error.issues 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create audit log" },
        { status: 500 }
      );
    }
  });
}