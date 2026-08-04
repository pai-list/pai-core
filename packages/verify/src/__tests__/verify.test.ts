// src/__tests__/verify.test.ts - Unit tests for verification logic
import { Verifier } from "../verify";

const verifier = new Verifier();

describe("Verifier", () => {
  describe("validatePiIdentity", () => {
    it("validates a correct Pi identity", () => {
      const result = verifier.validatePiIdentity({
        username: "testuser",
        piAddress: "GA1234567890123456789012345678901234567890",
        tier: "pro",
      });

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects invalid username (too short)", () => {
      const result = verifier.validatePiIdentity({
        username: "ab",
        piAddress: "GA1234567890123456789012345678901234567890",
        tier: "pro",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username must be at least 3 characters");
    });

    it("rejects invalid Pi address format", () => {
      const result = verifier.validatePiIdentity({
        username: "testuser",
        piAddress: "INVALID-ADDRESS",
        tier: "pro",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid Pi Network address format");
    });

    it("rejects invalid tier", () => {
      const result = verifier.validatePiIdentity({
        username: "testuser",
        piAddress: "GA1234567890123456789012345678901234567890",
        tier: "invalid",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid tier: invalid");
    });

    it("accepts all valid tier options", () => {
      const validTiers = ['free', 'basic', 'pro', 'enterprise', 'sovereign'];

      for (const tier of validTiers) {
        const result = verifier.validatePiIdentity({
          username: "testuser",
          piAddress: "GA1234567890123456789012345678901234567890",
          tier,
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("validates edge case: single character username", () => {
      const result = verifier.validatePiIdentity({
        username: "a",
        piAddress: "GA1234567890123456789012345678901234567890",
        tier: "pro",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Username must be at least 3 characters");
    });

    it("validates Pi address edge cases", () => {
      const testCases = [
        { address: "", valid: false },
        { address: "G", valid: false },
        { address: "GA1234567890123456789012345678901234567890", valid: true },
        { address: "GA1234567890123456789012345678901234567891", valid: true },
      ];

      for (const test of testCases) {
        const result = verifier.validatePiIdentity({
          username: "test",
          piAddress: test.address,
          tier: "pro",
        });

        expect(result.valid).toBe(test.valid, `Failed for address: ${test.address}`);
      }
    });
  });

  describe("validateKyc", () => {
    const validKyc = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      idDocument: "id-123",
    };

    it("validates complete KYC data", () => {
      const result = verifier.validateKyc(validKyc);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects missing name", () => {
      const result = verifier.validateKyc({
        ...validKyc,
        name: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be at least 2 characters");
    });

    it("rejects invalid email", () => {
      const result = verifier.validateKyc({
        ...validKyc,
        email: "invalid-email",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid email format");
    });

    it("rejects invalid phone", () => {
      const result = verifier.validateKyc({
        ...validKyc,
        phone: "123",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid phone number format");
    });

    it("rejects missing ID document", () => {
      const result = verifier.validateKyc({
        ...validKyc,
        idDocument: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("ID document verification required");
    });

    it("handles multiple validation errors", () => {
      const result = verifier.validateKyc({
        name: "A",
        email: "invalid",
        phone: "123",
        idDocument: "",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("validateAgentCapabilities", () => {
    it("validates complete capability set", () => {
      const result = verifier.validateAgentCapabilities(['read', 'write', 'execute']);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects missing read capability", () => {
      const result = verifier.validateAgentCapabilities(['write', 'execute']);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required capabilities: read");
    });

    it("rejects missing multiple capabilities", () => {
      const result = verifier.validateAgentCapabilities(['read']);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required capabilities: write, execute");
    });

    it("warns about dangerous capabilities", () => {
      const result = verifier.validateAgentCapabilities([
        'read', 'write', 'execute:command', 'network:egress:external'
      ]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("High-risk capabilities detected: execute:command, network:egress:external");
    });

    it("handles empty capabilities", () => {
      const result = verifier.validateAgentCapabilities([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required capabilities: read, write, execute");
    });

    it("validates mixed dangerous and safe capabilities", () => {
      const result = verifier.validateAgentCapabilities([
        'read', 'write:filesystem', 'execute:command'
      ]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("High-risk capabilities detected: execute:command");
    });
  });

  describe("verifyIdentityWithKyc", () => {
    const validPiIdentity = {
      username: "testuser",
      piAddress: "GA1234567890123456789012345678901234567890",
      tier: "pro",
    };

    const validKyc = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      idDocument: "id-123",
    };

    const validCapabilities = ['read', 'write', 'execute'];

    it("validates complete identity with KYC", () => {
      const result = verifier.verifyIdentityWithKyc(
        validPiIdentity,
        validKyc,
        validCapabilities
      );

      expect(result.piValid.valid).toBe(true);
      expect(result.kycValid.valid).toBe(true);
      expect(result.capabilitiesValid.valid).toBe(true);
      expect(result.overall.valid).toBe(true);
      expect(result.overall.score).toBeGreaterThanOrEqual(80);
    });

    it("fails when any component fails", () => {
      const result = verifier.verifyIdentityWithKyc(
        { ...validPiIdentity, username: "ab" },
        validKyc,
        validCapabilities
      );

      expect(result.overall.valid).toBe(false);
      expect(result.overall.errors.length).toBeGreaterThan(0);
    });

    it("provides detailed component results", () => {
      const result = verifier.verifyIdentityWithKyc(
        validPiIdentity,
        { ...validKyc, email: "invalid" },
        validCapabilities
      );

      expect(result.piValid.valid).toBe(true);
      expect(result.kycValid.valid).toBe(false);
      expect(result.capabilitiesValid.valid).toBe(true);
      expect(result.kycValid.errors).toContain("Invalid email format");
    });

    it("handles score calculation edge cases", () => {
      const lowScorePi = {
        username: "ab",
        piAddress: "INVALID",
        tier: "invalid",
      };

      const result = verifier.verifyIdentityWithKyc(
        lowScorePi,
        { ...validKyc, name: "a", phone: "123", idDocument: "" },
        ['read']
      );

      expect(result.overall.score).toBeLessThan(80);
      expect(result.overall.valid).toBe(false);
    });
  });
});
