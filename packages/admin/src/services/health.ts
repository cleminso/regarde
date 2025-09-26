import { Loaded } from "jazz-tools";
import {
  RegistryWorkerAccount,
  OnboardingAccount,
  NicknameRegistryCoRecord,
  ReverseNicknameRegistryCoRecord,
  ReservedNicknamesRegistry,
  RegistryAuditLog,
  JazzAppProfile,
} from "@onboarding.jazz/shared-schemas";
import {
  HealthServiceInterface,
  HealthReport,
  NicknameHealthReport,
  FixResult,
} from "../types/services.js";
import { AuditService } from "./audit.js";

export class HealthService implements HealthServiceInterface {
  constructor(
    private worker: Loaded<typeof RegistryWorkerAccount>,
    private nicknameRegistry: Loaded<typeof NicknameRegistryCoRecord>,
    private reverseNicknameRegistry: Loaded<typeof ReverseNicknameRegistryCoRecord>,
    private reservedNicknames: Loaded<typeof ReservedNicknamesRegistry>,
    private auditLog: Loaded<typeof RegistryAuditLog>,
    private auditService: AuditService,
  ) {}

  async healthCheck(): Promise<HealthReport> {
    const registryEntries = Object.entries(this.nicknameRegistry);
    const reverseRegistryEntries = Object.entries(this.reverseNicknameRegistry);

    const orphanedNicknames: string[] = [];
    const orphanedAccounts: string[] = [];
    const nicknameToAccounts: Record<string, string[]> = {};
    const accountToNicknames: Record<string, string[]> = {};

    // Check for orphaned nicknames and duplicates
    for (const [nickname, accountId] of registryEntries) {
      const nicknameStr = String(nickname);
      const accountIdStr = String(accountId);

      if (this.reverseNicknameRegistry[accountIdStr] !== nicknameStr) {
        orphanedNicknames.push(nicknameStr);
      }

      if (!nicknameToAccounts[nicknameStr]) {
        nicknameToAccounts[nicknameStr] = [];
      }
      nicknameToAccounts[nicknameStr].push(accountIdStr);
    }

    // Check for orphaned accounts and duplicates
    for (const [accountId, nickname] of reverseRegistryEntries) {
      const accountIdStr = String(accountId);
      const nicknameStr = String(nickname);

      if (this.nicknameRegistry[nicknameStr] !== accountIdStr) {
        orphanedAccounts.push(accountIdStr);
      }

      if (!accountToNicknames[accountIdStr]) {
        accountToNicknames[accountIdStr] = [];
      }
      accountToNicknames[accountIdStr].push(nicknameStr);
    }

    const duplicateNicknames = Object.entries(nicknameToAccounts)
      .filter(([, accounts]) => accounts.length > 1)
      .map(([nickname, accounts]) => ({ nickname, accounts }));

    const duplicateAccounts = Object.entries(accountToNicknames)
      .filter(([, nicknames]) => nicknames.length > 1)
      .map(([account, nicknames]) => ({ account, nicknames }));

    const inconsistencies = {
      orphanedNicknames,
      orphanedAccounts,
      duplicateNicknames,
      duplicateAccounts,
    };

    const isHealthy =
      orphanedNicknames.length === 0 &&
      orphanedAccounts.length === 0 &&
      duplicateNicknames.length === 0 &&
      duplicateAccounts.length === 0;

    const issues: string[] = [];
    if (orphanedNicknames.length > 0) {
      issues.push(`${orphanedNicknames.length} orphaned nicknames found`);
    }
    if (orphanedAccounts.length > 0) {
      issues.push(`${orphanedAccounts.length} orphaned accounts found`);
    }
    if (duplicateNicknames.length > 0) {
      issues.push(`${duplicateNicknames.length} duplicate nicknames found`);
    }
    if (duplicateAccounts.length > 0) {
      issues.push(`${duplicateAccounts.length} duplicate accounts found`);
    }

    return {
      status: isHealthy ? "healthy" : "warning",
      registryEntries: registryEntries.length,
      reverseRegistryEntries: reverseRegistryEntries.length,
      reservedNicknames: Object.keys(this.reservedNicknames).length,
      auditLogEntries: this.auditLog.length,
      issues,
      lastChecked: new Date().toISOString(),
      totalNicknames: registryEntries.length,
      totalAccounts: reverseRegistryEntries.length,
      inconsistencies,
      isHealthy,
    };
  }

  async checkNicknameHealth(
    nickname?: string,
    accountId?: string,
  ): Promise<NicknameHealthReport> {
    let targetNickname = nickname;
    let targetAccountId = accountId;

    if (nickname && !accountId) {
      targetAccountId = this.nicknameRegistry[nickname];
    } else if (accountId && !nickname) {
      targetNickname = this.reverseNicknameRegistry[accountId];
    }

    const report: NicknameHealthReport = {
      nickname: targetNickname,
      accountId: targetAccountId,
      registryStatus: "ok",
      reverseRegistryStatus: "ok",
      onboardingStatus: "ok",
      issues: [],
      recommendations: [],
    };

    // Add validation for missing nickname/accountId
    if (!targetNickname && !targetAccountId) {
      report.registryStatus = "missing";
      report.reverseRegistryStatus = "missing";
      report.issues.push("Neither nickname nor account ID could be resolved");
      return report;
    }

    if (targetNickname) {
      const registryAccountId = this.nicknameRegistry[targetNickname];
      if (!registryAccountId) {
        report.registryStatus = "missing";
        report.issues.push(
          `Nickname "${targetNickname}" not found in registry`,
        );
      } else if (registryAccountId !== targetAccountId) {
        report.registryStatus = "mismatch";
        report.issues.push(
          `Registry shows nickname "${targetNickname}" belongs to ${registryAccountId}, but expected ${targetAccountId}`,
        );
      }
    }

    if (targetAccountId) {
      const reverseNickname = this.reverseNicknameRegistry[targetAccountId];
      if (!reverseNickname) {
        report.reverseRegistryStatus = "missing";
        report.issues.push(
          `Account ID "${targetAccountId}" not found in reverse registry`,
        );
      } else if (reverseNickname !== targetNickname) {
        report.reverseRegistryStatus = "mismatch";
        report.issues.push(
          `Reverse registry shows account "${targetAccountId}" has nickname "${reverseNickname}", but expected "${targetNickname}"`,
        );
      }
    }

    if (targetAccountId) {
      try {
        const account = await OnboardingAccount.load(targetAccountId, {
          resolve: {
            profile: {
              "regarde.bio": {
                userHandle: true,
              },
            },
          },
        });

        if (!account) {
          report.onboardingStatus = "not_found";
          report.issues.push(
            `Account "${targetAccountId}" not found or not accessible`,
          );
        } else if (!account.profile) {
          report.onboardingStatus = "missing";
          report.issues.push(`Account "${targetAccountId}" has no profile`);
        } else {
          const profileData = await JazzAppProfile.load(
            account.profile["regarde.bio"],
            {
              resolve: {
                userHandle: true,
              },
            },
          );

          if (!profileData) {
            report.onboardingStatus = "missing";
            report.issues.push(
              `Account "${targetAccountId}" has no profile data`,
            );
          } else {
            const userHandle = profileData.userHandle;

            if (!userHandle) {
              report.onboardingStatus = "missing";
              report.issues.push(
                `Account "${targetAccountId}" has no userHandle data`,
              );
              report.recommendations.push(
                `Create userHandle data for account`,
              );
            } else {
              const isActive = userHandle.isActive;
              const storedNickname = userHandle.nickname;

              if (!isActive) {
                report.onboardingStatus = "inactive";
                report.issues.push(
                  `UserHandle is inactive (isActive: false)`,
                );
                report.recommendations.push(
                  `Activate userHandle and sync with registry`,
                );
              }

              if (storedNickname !== targetNickname) {
                report.onboardingStatus = "mismatch";
                report.issues.push(
                  `UserHandle shows "${storedNickname}", but registry shows "${targetNickname}"`,
                );
                report.recommendations.push(
                  `Sync userHandle with registry data`,
                );
              }
            }
          }
        }
      } catch (error) {
        report.onboardingStatus = "not_found";
        report.issues.push(
          `Failed to load account "${targetAccountId}": ${error}`,
        );
      }
    }

    return report;
  }

  async fixNickname(nickname?: string, accountId?: string): Promise<FixResult> {
    const changes: string[] = [];
    const errors: string[] = [];

    let targetNickname = nickname;
    let targetAccountId = accountId;

    if (nickname && !accountId) {
      targetAccountId = this.nicknameRegistry[nickname];
      if (targetAccountId) {
        changes.push(`Resolved account ID: ${targetAccountId}`);
      }
    } else if (accountId && !nickname) {
      targetNickname = this.reverseNicknameRegistry[accountId];
      if (targetNickname) {
        changes.push(`Resolved nickname: ${targetNickname}`);
      }
    }

    if (!targetNickname || !targetAccountId) {
      errors.push("Could not resolve both nickname and account ID");
      return { success: false, changes, errors };
    }

    const registryAccountId = this.nicknameRegistry[targetNickname];
    if (registryAccountId !== targetAccountId) {
      this.nicknameRegistry.$jazz.set(targetNickname, targetAccountId);
      changes.push(`Updated registry: ${targetNickname} → ${targetAccountId}`);
    }

    const reverseNickname = this.reverseNicknameRegistry[targetAccountId];
    if (reverseNickname !== targetNickname) {
      this.reverseNicknameRegistry.$jazz.set(targetAccountId, targetNickname);
      changes.push(
        `Updated reverse registry: ${targetAccountId} → ${targetNickname}`,
      );
    }

    try {
      await this.auditService.logChange(
        targetAccountId,
        undefined,
        targetNickname,
        "admin-cli",
      );
      changes.push(`Logged fix operation to audit trail`);
    } catch (error) {
      errors.push(`Failed to log fix operation: ${error}`);
    }

    return {
      success: errors.length === 0,
      changes,
      errors,
    };
  }
}
