// src/verify.ts - Core verification logic
import { z } from 'zod';

export interface VerificationResult {
  valid: boolean;
  score: number;
  errors: string[];
}

export class Verifier {
  // Validate Pi Network identity
  validatePiIdentity(identity: { username: string; piAddress: string; tier: string }): VerificationResult {
    const errors: string[] = [];
    let score = 100;

    // Username validation
    if (!identity.username || identity.username.length < 3) {
      errors.push('Username must be at least 3 characters');
      score -= 20;
    }

    // Pi address validation (Stellar-style)
    if (!identity.piAddress || !/^G[A-Z2-7]{55}$/.test(identity.piAddress)) {
      errors.push('Invalid Pi Network address format');
      score -= 30;
    }

    // Tier validation
    const validTiers = ['free', 'basic', 'pro', 'enterprise', 'sovereign'];
    if (!validTiers.includes(identity.tier.toLowerCase())) {
      errors.push(`Invalid tier: ${identity.tier}`);
      score -= 10;
    }

    return {
      valid: errors.length === 0 && score >= 80,
      score,
      errors,
    };
  }

  // Validate KYC compliance
  validateKyc(kycData: {
    name: string;
    email: string;
    phone: string;
    idDocument: string;
  }): VerificationResult {
    const errors: string[] = [];
    let score = 100;

    if (!kycData.name || kycData.name.length < 2) {
      errors.push('Name must be at least 2 characters');
      score -= 25;
    }

    if (!kycData.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(kycData.email)) {
      errors.push('Invalid email format');
      score -= 20;
    }

    if (!kycData.phone || !/^[+0-9\s()]{10,}$/.test(kycData.phone)) {
      errors.push('Invalid phone number format');
      score -= 20;
    }

    if (!kycData.idDocument) {
      errors.push('ID document verification required');
      score -= 35;
    }

    return {
      valid: errors.length === 0 && score >= 80,
      score,
      errors,
    };
  }

  // Validate agent capabilities
  validateAgentCapabilities(capabilities: string[]): VerificationResult {
    const errors: string[] = [];
    let score = 100;

    const requiredCapabilities = ['read', 'write', 'execute'];
    const missing = requiredCapabilities.filter(cap => !capabilities.includes(cap));

    if (missing.length > 0) {
      errors.push(`Missing required capabilities: ${missing.join(', ')}`);
      score -= missing.length * 20;
    }

    const dangerousCapabilities = ['execute:command', 'write:filesystem', 'network:egress:external'];
    const dangerousFound = dangerousCapabilities.filter(danger => capabilities.includes(danger));

    if (dangerousFound.length > 0) {
      errors.push(`High-risk capabilities detected: ${dangerousFound.join(', ')}`);
      score -= dangerousFound.length * 30;
    }

    return {
      valid: errors.length === 0 && score >= 80,
      score,
      errors,
    };
  }

  // Comprehensive verification
  verifyIdentityWithKyc(piIdentity: any, kycData: any, agentCapabilities: string[]): {
    piValid: VerificationResult;
    kycValid: VerificationResult;
    capabilitiesValid: VerificationResult;
    overall: VerificationResult;
  } {
    const piValid = this.validatePiIdentity(piIdentity);
    const kycValid = this.validateKyc(kycData);
    const capabilitiesValid = this.validateAgentCapabilities(agentCapabilities);

    const allErrors = [
      ...piValid.errors,
      ...kycValid.errors,
      ...capabilitiesValid.errors,
    ];

    const totalScore = (piValid.score + kycValid.score + capabilitiesValid.score) / 3;

    return {
      piValid,
      kycValid,
      capabilitiesValid,
      overall: {
        valid: allErrors.length === 0 && totalScore >= 80,
        score: totalScore,
        errors: allErrors,
      },
    };
  }
}
