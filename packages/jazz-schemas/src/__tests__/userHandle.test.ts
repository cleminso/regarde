/**
 * Focused tests for nickname business logic - testing core business rules only
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  setupJazzTestEnvironment,
  createTestRegardeAccount,
} from "../test-utils/jazz-setup.js";
import {
  UserHandle,
  setNicknameFromRegistry,
  deactivate,
} from "../regarde.dev/userHandle.js";

describe("Nickname Business Logic", () => {
  beforeEach(async () => {
    await setupJazzTestEnvironment();
  });

  it("should handle nickname registration workflow", async () => {
    // Create a real Jazz UserHandle object
    const userHandle = UserHandle.create({
      nickname: "oldname",
      isActive: false,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    });

    setNicknameFromRegistry(userHandle, "newname");

    expect(userHandle.nickname).toBe("newname");
    expect(userHandle.isActive).toBe(true);
  });

  it("should handle user deactivation workflow", async () => {
    // Create a real Jazz UserHandle object
    const userHandle = UserHandle.create({
      nickname: "activeuser",
      isActive: true,
      registeredAt: Date.now(),
      lastModified: Date.now(),
    });

    deactivate(userHandle);

    expect(userHandle.nickname).toBe("activeuser");
    expect(userHandle.isActive).toBe(false);
  });
});
