/**
 * Jazz testing utilities for shared-schemas package
 * Inspired by Jazz testing patterns but adapted for our specific schemas
 */

import { setupJazzTestSync, createJazzTestAccount } from 'jazz-tools/testing';
import { Account, Group } from 'jazz-tools';
import { OnboardingAccount } from '../profile.js';
import { UserHandle } from '../nickname.js';

/**
 * Sets up Jazz testing environment with sync server
 * Call this in beforeEach of every test file that uses Jazz
 */
export async function setupJazzTestEnvironment() {
  await setupJazzTestSync();
  
  // Create a default test account to ensure Jazz context is available
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
    AccountSchema: OnboardingAccount,
  });
}

/**
 * Creates a test UserHandle with real Jazz CoValue
 */
export async function createTestUserHandle(nickname: string, isActive: boolean) {
  return UserHandle.create({
    nickname,
    isActive,
    registeredAt: Date.now(),
    lastModified: Date.now(),
  });
}

/**
 * Creates a test OnboardingAccount with optional creation props
 * This properly triggers the migration to create root and profile structures
 */
export async function createTestOnboardingAccount(options: {
  isCurrentActiveAccount?: boolean;
  name?: string;
} = {}) {
  const { isCurrentActiveAccount = true, name = 'Test User' } = options;

  const account = await createJazzTestAccount({
    isCurrentActiveAccount,
    creationProps: { name },
    AccountSchema: OnboardingAccount,
  });

  // Wait for migration to complete
  await account.$jazz.waitForSync();
  
  // Give migration time to run
  await new Promise(resolve => setTimeout(resolve, 100));

  return account;
}

/**
 * Creates a test worker account (simulates profile-worker)
 */
export async function createTestWorkerAccount() {
  const account = await createJazzTestAccount({
    isCurrentActiveAccount: false,
    creationProps: { name: 'Test Worker' },
    AccountSchema: OnboardingAccount,
  });

  // Wait for migration to complete
  await account.$jazz.waitForSync();

  return account;
}

/**
 * Creates a public group with "everyone" write access
 * Simulates the worker group pattern from your migration
 */
export function createPublicGroup(owner?: Account) {
  const group = Group.create(owner ? { owner } : undefined);
  group.addMember('everyone', 'writer');
  return group;
}

/**
 * Utility to wait for async operations in tests
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = async () => {
      try {
        const result = await condition();
        if (result) {
          resolve();
          return;
        }
      } catch (error) {
        // Continue checking
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}
