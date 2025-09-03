/**
 * Focused tests for nickname business logic - testing core business rules only
 */

import { describe, it, expect } from "vitest";
import { setNicknameFromRegistry, deactivate } from "../nickname.js";

// Simple test data that matches the business logic interface
function createUserHandle(nickname: string, isActive: boolean) {
  return {
    nickname,
    isActive,
    registeredAt: Date.now(),
    lastModified: Date.now(),
  };
}

describe("Nickname Business Logic", () => {
  it("should handle nickname registration workflow", () => {
    // Test business logic: registering a nickname activates the user handle
    const userHandle = createUserHandle("oldname", false);

    setNicknameFromRegistry(userHandle as any, "newname");

    expect(userHandle.nickname).toBe("newname");
    expect(userHandle.isActive).toBe(true);
  });

  it("should handle user deactivation workflow", () => {
    // Test business logic: deactivating preserves nickname but changes status
    const userHandle = createUserHandle("activeuser", true);

    deactivate(userHandle as any);

    expect(userHandle.nickname).toBe("activeuser");
    expect(userHandle.isActive).toBe(false);
  });


});
