import { hashPassword, verifyPassword, generateToken, verifyToken } from "@/lib/auth";
import * as jwt from "jsonwebtoken";

describe("Authentication Utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT tokens", () => {
    const originalEnv = process.env;

    beforeAll(() => {
      process.env.NEXTAUTH_SECRET = "test-secret-key";
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    describe("generateToken", () => {
      it("should generate a valid JWT token", () => {
        const payload = { userId: "123", email: "test@example.com" };
        const token = generateToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
      });
    });

    describe("verifyToken", () => {
      it("should verify and decode a valid token", () => {
        const payload = { userId: "123", email: "test@example.com" };
        const token = generateToken(payload);

        const decoded = verifyToken(token);
        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.email).toBe(payload.email);
      });

      it("should throw error for invalid token", () => {
        const invalidToken = "invalid.token.here";

        expect(() => verifyToken(invalidToken)).toThrow();
      });

      it("should throw error for expired token", () => {
        const payload = { userId: "123" };
        const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
          expiresIn: "-1s",
        });

        expect(() => verifyToken(token)).toThrow();
      });
    });
  });
});
