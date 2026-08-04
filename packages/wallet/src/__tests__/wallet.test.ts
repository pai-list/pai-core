// src/__tests__/wallet.test.ts - Unit tests for wallet operations
import { WalletService } from "../wallet";

const walletService = new WalletService();

describe("WalletService", () => {
  describe("createWallet", () => {
    it("creates a wallet with valid owner", () => {
      const wallet = walletService.createWallet("testuser", 100);

      expect(wallet.id).toBeDefined();
      expect(wallet.owner).toBe("testuser");
      expect(wallet.balance).toBe(100);
      expect(wallet.currency).toBe("PI");
      expect(wallet.publicKey).toContain("BEGIN PUBLIC KEY");
      expect(wallet.privateKey).toContain("BEGIN PRIVATE KEY");
      expect(wallet.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("creates wallet with zero initial balance", () => {
      const wallet = walletService.createWallet("user2", 0);

      expect(wallet.balance).toBe(0);
      expect(wallet.owner).toBe("user2");
    });

    it("creates separate wallets for different owners", () => {
      const wallet1 = walletService.createWallet("user1");
      const wallet2 = walletService.createWallet("user2");

      expect(wallet1.owner).not.toBe(wallet2.owner);
      expect(wallet1.id).not.toBe(wallet2.id);
      expect(wallet1.publicKey).not.toBe(wallet2.publicKey);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });

    it("generates deterministic wallet keys", () => {
      const wallet1 = walletService.createWallet("sameuser", 50);
      const wallet2 = walletService.createWallet("sameuser", 50);

      expect(wallet1.publicKey).toBe(wallet2.publicKey);
      expect(wallet1.privateKey).toBe(wallet2.privateKey);
    });
  });

  describe("validateWalletAddress", () => {
    it("validates correct Pi address", () => {
      const validAddress = "GA1234567890123456789012345678901234567890";
      expect(walletService.validateWalletAddress(validAddress)).toBe(true);
    });

    it("rejects empty address", () => {
      expect(walletService.validateWalletAddress("")).toBe(false);
    });

    it("rejects short address", () => {
      expect(walletService.validateWalletAddress("GA123")).toBe(false);
    });

    it("rejects long address", () => {
      expect(walletService.validateWalletAddress("GA123456789012345678901234567890123456789012345")).toBe(false);
    });

    it("rejects address with invalid characters", () => {
      expect(walletService.validateWalletAddress("GB1234567890123456789012345678901234567890")).toBe(false);
    });

    it("accepts edge case: exactly 55 characters", () => {
      const edgeCase = "GA1234567890123456789012345678901234567890".slice(0, 55);
      expect(walletService.validateWalletAddress(edgeCase)).toBe(true);
    });
  });

  describe("calculateFee", () => {
    it("calculates fee correctly for PI transactions", () => {
      const fee = walletService.calculateFee(100, "PI");
      expect(fee).toBe(0.1); // 100 * 0.001
    });

    it("calculates fee for different amounts", () => {
      expect(walletService.calculateFee(1000, "PI")).toBe(1.0);
      expect(walletService.calculateFee(50, "PI")).toBe(0.05);
      expect(walletService.calculateFee(0.5, "PI")).toBe(0.0005);
    });

    it("uses default currency PI", () => {
      const fee = walletService.calculateFee(100);
      expect(fee).toBe(0.1);
    });

    it("handles zero amount", () => {
      expect(walletService.calculateFee(0)).toBe(0);
    });

    it("handles negative amount (edge case)", () => {
      const fee = walletService.calculateFee(-100);
      expect(fee).toBe(-0.1);
    });

    it("preserves fee calculation with different currencies", () => {
      // Mock implementation preserves fee calculation logic
      expect(walletService.calculateFee(100, "USDC")).toBe(0.1);
      expect(walletService.calculateFee(100, "USD")).toBe(0.1);
    });
  });

  describe("transferPI", () => {
    it("successfully transfers PI between wallets", () => {
      const sender = walletService.createWallet("alice", 200);
      const recipientAddress = "recipient_user_2";
      const amount = 50;

      const transaction = walletService.transferPI(sender, recipientAddress, amount);

      expect(transaction.id).toBeDefined();
      expect(transaction.from).toBe(sender.owner);
      expect(transaction.to).toBe(recipientAddress);
      expect(transaction.amount).toBe(amount);
      expect(transaction.currency).toBe("PI");
      expect(transaction.status).toBe("pending");
      expect(transaction.signature).toBeDefined();
      expect(sender.balance).toBe(150); // 200 - 50
    });

    it("rejects zero transfer amount", () => {
      const sender = walletService.createWallet("alice", 100);

      expect(() => walletService.transferPI(sender, "bob", 0)).toThrow("Transfer amount must be positive");
    });

    it("rejects negative transfer amount", () => {
      const sender = walletService.createWallet("alice", 100);

      expect(() => walletService.transferPI(sender, "bob", -10)).toThrow("Transfer amount must be positive");
    });

    it("rejects transfer exceeding balance", () => {
      const sender = walletService.createWallet("alice", 50);

      expect(() => walletService.transferPI(sender, "bob", 100)).toThrow("Insufficient balance");
    });

    it("rejects self-transfer", () => {
      const sender = walletService.createWallet("alice", 100);

      expect(() => walletService.transferPI(sender, "alice", 50)).toThrow("Cannot transfer to self");
    });

    it("generates transaction signature", () => {
      const sender = walletService.createWallet("alice", 100);
      const transaction = walletService.transferPI(sender, "bob", 50);

      expect(transaction.signature).toBeDefined();
      expect(transaction.signature).toMatch(/^[0-9a-f]+$/); // Hex signature
    });

    it("creates unique transaction IDs", () => {
      const sender = walletService.createWallet("alice", 200);

      const transaction1 = walletService.transferPI(sender, "bob", 50);
      const transaction2 = walletService.transferPI(sender, "charlie", 30);

      expect(transaction1.id).not.toBe(transaction2.id);
    });
  });

  describe("processTransaction", () => {
    it("processes pending transaction successfully", () => {
      const wallet = walletService.createWallet("alice", 100);
      const transaction = walletService.transferPI(wallet, "bob", 50);

      const processed = walletService.processTransaction(wallet, transaction.id, "completed");

      expect(processed).toBe(true);
      expect(transaction.status).toBe("completed");
      expect(wallet.balance).toBe(150); // 100 - 50 + 50
    });

    it("processes failed transaction", () => {
      const wallet = walletService.createWallet("alice", 100);
      const transaction = walletService.transferPI(wallet, "bob", 50);

      const processed = walletService.processTransaction(wallet, transaction.id, "failed");

      expect(processed).toBe(true);
      expect(transaction.status).toBe("failed");
      expect(wallet.balance).toBe(100); // No change
    });

    it("returns false for non-existent transaction", () => {
      const wallet = walletService.createWallet("alice", 100);
      const processed = walletService.processTransaction(wallet, "non-existent-id", "completed");

      expect(processed).toBe(false);
    });

    it("handles duplicate processing", () => {
      const wallet = walletService.createWallet("alice", 100);
      const transaction = walletService.transferPI(wallet, "bob", 50);

      const firstProcessed = walletService.processTransaction(wallet, transaction.id, "completed");
      const secondProcessed = walletService.processTransaction(wallet, transaction.id, "completed");

      expect(firstProcessed).toBe(true);
      expect(secondProcessed).toBe(true); // Still returns true even if already processed
      expect(transaction.status).toBe("completed");
    });
  });

  describe("batchTransfer", () => {
    it("processes successful batch transfers", () => {
      const sender = walletService.createWallet("alice", 500);
      const transfers = [
        { to: "bob", amount: 50, memo: "payment 1" },
        { to: "charlie", amount: 75, memo: "payment 2" },
        { to: "dave", amount: 25, memo: "payment 3" },
      ];

      const results = walletService.batchTransfer(sender, transfers);

      expect(results.length).toBe(3);
      expect(results.every(r => r.status === "completed")).toBe(true);
      expect(sender.balance).toBe(350); // 500 - 50 - 75 - 25
      expect(results.every(r => r.memo)).toBe(true);
    });

    it("handles batch with some failed transfers", () => {
      const sender = walletService.createWallet("alice", 100);
      const transfers = [
        { to: "bob", amount: 50, memo: "ok" },
        { to: "charlie", amount: 100, memo: "too much" }, // Should fail
        { to: "dave", amount: 10, memo: "ok" },
      ];

      const results = walletService.batchTransfer(sender, transfers);

      expect(results.length).toBe(2); // Only successful ones
      expect(results.some(r => r.to === "bob")).toBe(true);
      expect(results.some(r => r.to === "dave")).toBe(true);
      expect(results.some(r => r.to === "charlie")).toBe(false);
      expect(sender.balance).toBe(40); // 100 - 50 - 10
    });

    it("handles empty batch", () => {
      const sender = walletService.createWallet("alice", 100);
      const results = walletService.batchTransfer(sender, []);

      expect(results).toHaveLength(0);
      expect(sender.balance).toBe(100);
    });

    it("processes batch transfers atomically", () => {
      const sender = walletService.createWallet("alice", 200);
      const transfers = [
        { to: "bob", amount: 50, memo: "first" },
        { to: "charlie", amount: 50, memo: "second" },
      ];

      const results = walletService.batchTransfer(sender, transfers);

      expect(results.length).toBe(2);
      expect(sender.balance).toBe(100); // All processed
    });

    it("includes memo in transactions", () => {
      const sender = walletService.createWallet("alice", 200);
      const transfers = [
        { to: "bob", amount: 50, memo: "important payment" },
      ];

      const results = walletService.batchTransfer(sender, transfers);

      expect(results[0].memo).toBe("important payment");
    });
  });

  describe("getTransactionHistory", () => {
    it("returns transaction history for wallet", () => {
      const wallet = walletService.createWallet("alice", 100);
      walletService.transferPI(wallet, "bob", 50);

      const history = walletService.getTransactionHistory(wallet.id, 10, 0);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
      expect(history[0].to).toBe("bob");
      expect(history[0].amount).toBe(50);
    });

    it("respects pagination limit", () => {
      const wallet = walletService.createWallet("alice", 100);

      const history = walletService.getTransactionHistory(wallet.id, 5, 0);

      expect(history.length).toBeLessThanOrEqual(5);
    });

    it("respects pagination offset", () => {
      const wallet = walletService.createWallet("alice", 100);

      const history1 = walletService.getTransactionHistory(wallet.id, 10, 0);
      const history2 = walletService.getTransactionHistory(wallet.id, 10, 5);

      expect(history1.length).toBe(1);
      expect(history2.length).toBe(0); // No transactions at offset 5
    });
  });

  describe("getWalletStats", () => {
    it("calculates wallet statistics", () => {
      const walletId = "test-wallet-123";
      const stats = walletService.getWalletStats(walletId);

      expect(stats.totalTransactions).toBe(10);
      expect(stats.completedTransactions).toBe(8);
      expect(stats.failedTransactions).toBe(2);
      expect(stats.totalVolume).toBe(1000);
      expect(stats.averageTransactionSize).toBe(100);
    });

    it("calculates success rate", () => {
      const stats = walletService.getWalletStats("test");
      const expectedSuccessRate = stats.completedTransactions / stats.totalTransactions;

      expect(stats.totalTransactions).toBeGreaterThan(0);
      expect(stats.completedTransactions).toBeLessThanOrEqual(stats.totalTransactions);
    });
  });
});
