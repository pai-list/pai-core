// src/wallet.ts - Core wallet operations
import { deriveKeypair, signPayload, verifySignature } from '@axiomid/crypto';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  memo: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  signature?: string;
}

export interface Wallet {
  id: string;
  owner: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

export class WalletService {
  // Create a new wallet
  createWallet(owner: string, initialBalance: number = 0): Wallet {
    const salt = process.env.SOVEREIGN_KEY_SALT || 'default-salt';
    const keypair = deriveKeypair(owner, 'wallet-owner', salt);

    return {
      id: uuidv4(),
      owner,
      balance: initialBalance,
      currency: 'PI',
      transactions: [],
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
      createdAt: Date.now(),
    };
  }

  // Get wallet balance
  getBalance(walletId: string): number {
    // In production, would fetch from database or KV store
    return 100; // Mock implementation
  }

  // Transfer PI between wallets
  transferPI(fromWallet: Wallet, toAddress: string, amount: number, memo: string = ''): Transaction {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    if (toAddress === fromWallet.owner) {
      throw new Error('Cannot transfer to self');
    }

    const transaction: Transaction = {
      id: uuidv4(),
      from: fromWallet.owner,
      to: toAddress,
      amount,
      currency: 'PI',
      memo,
      timestamp: Date.now(),
      status: 'pending',
    };

    // Sign the transaction
    const transactionHash = JSON.stringify(transaction);
    const signature = signPayload(transactionHash, fromWallet.privateKey);
    transaction.signature = signature;

    // Update wallet balance (mock)
    fromWallet.balance -= amount;

    // Save transaction (mock)
    fromWallet.transactions.push(transaction);

    return transaction;
  }

  // Process completed transaction
  processTransaction(wallet: Wallet, transactionId: string, status: 'completed' | 'failed'): boolean {
    const transaction = wallet.transactions.find(t => t.id === transactionId);

    if (!transaction) {
      return false;
    }

    transaction.status = status;

    if (status === 'completed' && transaction.to) {
      wallet.balance += transaction.amount;
    }

    return true;
  }

  // Get transaction history
  getTransactionHistory(walletId: string, limit: number = 50, offset: number = 0): Transaction[] {
    // In production, would fetch from database
    return []; // Mock implementation
  }

  // Validate wallet address
  validateWalletAddress(address: string): boolean {
    return /^[A-Z2-7]{55}$/.test(address);
  }

  // Calculate transaction fee
  calculateFee(amount: number, currency: string = 'PI'): number {
    const feeRate = 0.001; // 0.1% fee
    return amount * feeRate;
  }

  // Batch transfers
  batchTransfer(fromWallet: Wallet, transfers: Array<{ to: string; amount: number; memo: string }>): Transaction[] {
    const results: Transaction[] = [];

    for (const transfer of transfers) {
      try {
        const transaction = this.transferPI(fromWallet, transfer.to, transfer.amount, transfer.memo);
        transaction.status = 'completed'; // Auto-complete for batch
        results.push(transaction);
      } catch (error) {
        console.error(`Transfer failed: ${error.message}`);
      }
    }

    return results;
  }

  // Get wallet statistics
  getWalletStats(walletId: string): {
    totalTransactions: number;
    completedTransactions: number;
    totalVolume: number;
    averageTransactionSize: number;
  } {
    // In production, would fetch from database
    return {
      totalTransactions: 10,
      completedTransactions: 8,
      totalVolume: 1000,
      averageTransactionSize: 100,
    }; // Mock implementation
  }
}
