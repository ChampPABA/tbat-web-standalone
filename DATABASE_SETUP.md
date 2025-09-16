# Database & Services Setup Documentation

## Overview

This document provides comprehensive setup instructions for the TBAT Mock Exam Platform's database schema and core services.

## Quick Start

### 1. Local Development Setup

```bash
# Start Docker services
docker-compose up -d

# Install dependencies
cd apps/web
pnpm install

# Setup database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed test data

# Start development server
npm run dev
```

### 2. Environment Variables

Create `.env` file in `apps/web` with:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tbat_mock_exam"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend
RESEND_API_KEY="re_..."

# Redis/Upstash
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email
EMAIL_FROM="noreply@tbat-exam.com"
EMAIL_ADMIN="admin@tbat-exam.com"
```

## Database Schema

### Core Models

1. **User Management**
   - `User`: Student accounts with Thai language support
   - `UserSession`: Session management with 7-day expiry
   - `Account`: NextAuth.js OAuth accounts
   - `AdminUser`: Admin accounts with role-based permissions

2. **Exam System**
   - `ExamCode`: Unique codes (FREE-[8CHAR]-[SUBJECT] or ADV-[8CHAR])
   - `SessionCapacity`: Morning/Afternoon session management (10 users each)
   - `ExamResult`: Scores with 6-month expiry
   - `Analytics`: Advanced package analytics

3. **Payment Processing**
   - `Payment`: Stripe integration for 690/290 THB transactions
   - Supports ADVANCED_PACKAGE and POST_EXAM_UPGRADE

4. **PDF Management**
   - `PDFSolution`: Solution files with expiry
   - `PDFDownload`: Secure download tokens
   - `PDFNotification`: Bulk notification tracking

5. **Support System**
   - `SupportTicket`: Issue tracking
   - `AuditLog`: Admin action logging

## Service Configuration

### NextAuth.js Authentication

Location: `lib/auth.ts`

Features:

- Email/password authentication
- JWT strategy with 7-day sessions
- Thai name support
- Package type tracking

### Stripe Payment Integration

Location: `lib/stripe.ts`

Features:

- Thai Baht (THB) support
- Two package types:
  - Advanced: 690 THB
  - Upgrade: 290 THB
- Webhook handling for payment events
- Refund processing

### Resend Email Service

Location: `lib/email.ts`

Templates:

- Registration confirmation
- Exam tickets with codes
- Results notification
- PDF ready notifications

Features:

- Thai language templates
- Bulk email support
- Retry mechanism with exponential backoff

### Redis/Upstash Caching

Location: `lib/redis.ts`

Cached Data:

- Session capacity (1 min TTL)
- Exam results (1 hour TTL)
- Analytics (30 min TTL)
- User sessions (7 days TTL)

## Testing

### Test Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Service-specific tests
npm run test:db       # Database tests
npm run test:auth     # Authentication tests
npm run test:payments # Payment tests
npm run test:email    # Email tests
npm run test:cache    # Cache tests

# Full test suite
npm run test:all

# Coverage report
npm run test:coverage
```

### Test Data

Seed data includes:

- 2 admin users (superadmin/admin)
- 10 test users (5 free, 5 advanced)
- Sample exam codes
- Payment records
- PDF solutions
- Sample exam results

Test Credentials:

- Admin: `admin@tbat-exam.com` / `admin123`
- Free User: `free1@test.com` / `password123`
- Advanced User: `advanced1@test.com` / `password123`

## Docker Environment

### Services

1. **PostgreSQL** (Port 5432)
   - Database: tbat_mock_exam
   - User: postgres
   - Password: password

2. **Redis** (Port 6379)
   - Used for caching and sessions

3. **pgAdmin** (Port 8080)
   - Email: admin@tbat.local
   - Password: admin123

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Run migrations in Docker
docker-compose exec web npm run db:migrate

# Access database shell
docker-compose exec postgres psql -U postgres -d tbat_mock_exam

# Stop services
docker-compose down

# Reset everything
docker-compose down -v  # Removes volumes too
```

## Production Deployment

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Configure Vercel Postgres for DATABASE_URL
3. Set up Stripe webhooks endpoint
4. Configure Upstash Redis

### Database Migrations

```bash
# Production migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps

   # Restart PostgreSQL
   docker-compose restart postgres
   ```

2. **Prisma Client Not Found**

   ```bash
   npm run db:generate
   ```

3. **Migration Failed**

   ```bash
   # Reset database (CAUTION: Deletes all data)
   npm run db:reset
   ```

4. **Redis Connection Failed**

   ```bash
   # Check Redis status
   docker-compose logs redis

   # Restart Redis
   docker-compose restart redis
   ```

## Security Notes

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong NEXTAUTH_SECRET (min 32 chars)
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling in production
   - Enable SSL for database connections
   - Regular backups

3. **Payment Security**
   - Always verify Stripe webhooks
   - Use test keys for development
   - Log all payment events

## API Endpoints

### Authentication

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Webhooks

- `POST /api/webhooks/stripe` - Stripe payment webhooks

## Maintenance

### Regular Tasks

1. **Data Cleanup** (Monthly)
   - Remove expired exam results (>6 months)
   - Clean up old sessions
   - Archive completed support tickets

2. **Monitoring**
   - Check Redis memory usage
   - Monitor database connections
   - Review error logs

3. **Backups**
   - Daily database backups
   - Weekly full system backups
   - Test restore procedures monthly

## Support

For issues or questions:

- Check logs: `docker-compose logs [service]`
- Database GUI: http://localhost:8080 (pgAdmin)
- Prisma Studio: `npm run db:studio`
