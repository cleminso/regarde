/**
 * Focused tests for registry business rules - testing registry logic
 */

import { describe, it, expect } from "vitest";

// Simple business logic functions to test registry rules
function validateReservationEntry(entry: any) {
  const errors: string[] = [];

  if (!entry.reservedBy || entry.reservedBy.trim() === "") {
    errors.push("reservedBy is required");
  }

  if (!entry.reservedAt || typeof entry.reservedAt !== "number") {
    errors.push("reservedAt must be a valid timestamp");
  }

  if (entry.reservedAt && entry.reservedAt > Date.now()) {
    errors.push("reservedAt cannot be in the future");
  }

  const validCategories = ["admin", "brand", "system", "offensive", "custom"];
  if (!entry.category || !validCategories.includes(entry.category)) {
    errors.push(
      "category must be one of: admin, brand, system, offensive, custom",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateAuditEntry(entry: any) {
  const errors: string[] = [];

  if (!entry.monotonicId || entry.monotonicId.trim() === "") {
    errors.push("monotonicId is required");
  }

  if (!entry.timestamp || typeof entry.timestamp !== "number") {
    errors.push("timestamp must be a valid number");
  }

  if (!entry.jazzAccountId || entry.jazzAccountId.trim() === "") {
    errors.push("jazzAccountId is required");
  }

  if (!entry.changedBy || entry.changedBy.trim() === "") {
    errors.push("changedBy is required");
  }

  const validSources = ["admin-cli", "user-app", "worker"];
  if (!entry.source || !validSources.includes(entry.source)) {
    errors.push("source must be one of: admin-cli, user-app, worker");
  }

  const validActions = ["add", "update", "remove", "reserve", "unreserve"];
  if (!entry.action || !validActions.includes(entry.action)) {
    errors.push(
      "action must be one of: add, update, remove, reserve, unreserve",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function checkNicknameReservation(
  nickname: string,
  reservations: Record<string, any>,
) {
  const normalizedNickname = nickname.toLowerCase();
  const reservation = reservations[normalizedNickname];

  if (!reservation) {
    return {
      isReserved: false,
      canUse: true,
    };
  }

  return {
    isReserved: true,
    canUse: false,
    category: reservation.category,
    reason: reservation.reason || `Reserved for ${reservation.category} use`,
    reservedBy: reservation.reservedBy,
    reservedAt: reservation.reservedAt,
  };
}

function createAuditEntry(params: {
  jazzAccountId: string;
  oldNickname?: string;
  newNickname?: string;
  changedBy: string;
  source: "admin-cli" | "user-app" | "worker";
  action: "add" | "update" | "remove" | "reserve" | "unreserve";
  reservationReason?: string;
  reservationCategory?: "admin" | "brand" | "system" | "offensive" | "custom";
}) {
  return {
    monotonicId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    jazzAccountId: params.jazzAccountId,
    oldNickname: params.oldNickname,
    newNickname: params.newNickname,
    changedBy: params.changedBy,
    source: params.source,
    action: params.action,
    reservationReason: params.reservationReason,
    reservationCategory: params.reservationCategory,
  };
}

function validateNicknameRegistryOperation(
  operation: "register" | "update" | "remove",
  nickname: string,
  accountId: string,
  currentRegistry: Record<string, string>,
  reservations: Record<string, any>,
) {
  const errors: string[] = [];

  // Check if nickname is reserved
  const reservationCheck = checkNicknameReservation(nickname, reservations);
  if (reservationCheck.isReserved && operation !== "remove") {
    errors.push(`Nickname is reserved: ${reservationCheck.reason}`);
  }

  // Check operation-specific rules
  switch (operation) {
    case "register":
      if (currentRegistry[nickname.toLowerCase()]) {
        errors.push("Nickname is already registered");
      }
      break;

    case "update":
      if (!currentRegistry[nickname.toLowerCase()]) {
        errors.push("Cannot update unregistered nickname");
      }
      if (currentRegistry[nickname.toLowerCase()] !== accountId) {
        errors.push("Cannot update nickname owned by different account");
      }
      break;

    case "remove":
      if (!currentRegistry[nickname.toLowerCase()]) {
        errors.push("Cannot remove unregistered nickname");
      }
      if (currentRegistry[nickname.toLowerCase()] !== accountId) {
        errors.push("Cannot remove nickname owned by different account");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe("Registry Business Rules - Registry Logic", () => {
  it("should validate reservation entries correctly", () => {
    // Test reservation validation logic
    const validReservation = {
      reservedBy: "admin-user",
      reservedAt: Date.now() - 3600000, // 1 hour ago
      reason: "Brand protection",
      category: "brand",
    };

    const result = validateReservationEntry(validReservation);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid reservation entries", () => {
    // Test validation catches reservation errors
    const invalidCases = [
      {
        entry: { reservedBy: "", reservedAt: Date.now(), category: "admin" },
        expectedError: "reservedBy is required",
      },
      {
        entry: {
          reservedBy: "admin",
          reservedAt: "invalid",
          category: "admin",
        },
        expectedError: "reservedAt must be a valid timestamp",
      },
      {
        entry: {
          reservedBy: "admin",
          reservedAt: Date.now() + 3600000,
          category: "admin",
        },
        expectedError: "reservedAt cannot be in the future",
      },
      {
        entry: {
          reservedBy: "admin",
          reservedAt: Date.now(),
          category: "invalid",
        },
        expectedError:
          "category must be one of: admin, brand, system, offensive, custom",
      },
    ];

    invalidCases.forEach(({ entry, expectedError }) => {
      const result = validateReservationEntry(entry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it("should validate audit entries correctly", () => {
    // Test audit validation logic
    const validAudit = {
      monotonicId: "audit-123",
      timestamp: Date.now(),
      jazzAccountId: "account-123",
      oldNickname: "oldname",
      newNickname: "newname",
      changedBy: "admin-user",
      source: "admin-cli",
      action: "update",
    };

    const result = validateAuditEntry(validAudit);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid audit entries", () => {
    // Test audit validation catches errors
    const invalidCases = [
      {
        entry: {
          monotonicId: "",
          timestamp: Date.now(),
          jazzAccountId: "acc",
          changedBy: "user",
          source: "admin-cli",
          action: "add",
        },
        expectedError: "monotonicId is required",
      },
      {
        entry: {
          monotonicId: "id",
          timestamp: "invalid",
          jazzAccountId: "acc",
          changedBy: "user",
          source: "admin-cli",
          action: "add",
        },
        expectedError: "timestamp must be a valid number",
      },
      {
        entry: {
          monotonicId: "id",
          timestamp: Date.now(),
          jazzAccountId: "",
          changedBy: "user",
          source: "admin-cli",
          action: "add",
        },
        expectedError: "jazzAccountId is required",
      },
      {
        entry: {
          monotonicId: "id",
          timestamp: Date.now(),
          jazzAccountId: "acc",
          changedBy: "",
          source: "admin-cli",
          action: "add",
        },
        expectedError: "changedBy is required",
      },
      {
        entry: {
          monotonicId: "id",
          timestamp: Date.now(),
          jazzAccountId: "acc",
          changedBy: "user",
          source: "invalid",
          action: "add",
        },
        expectedError: "source must be one of: admin-cli, user-app, worker",
      },
      {
        entry: {
          monotonicId: "id",
          timestamp: Date.now(),
          jazzAccountId: "acc",
          changedBy: "user",
          source: "admin-cli",
          action: "invalid",
        },
        expectedError:
          "action must be one of: add, update, remove, reserve, unreserve",
      },
    ];

    invalidCases.forEach(({ entry, expectedError }) => {
      const result = validateAuditEntry(entry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expectedError);
    });
  });

  it("should check nickname reservations correctly", () => {
    // Test reservation checking logic
    const reservations = {
      admin: {
        reservedBy: "system",
        reservedAt: Date.now(),
        category: "admin",
        reason: "System reserved",
      },
      brand: {
        reservedBy: "company",
        reservedAt: Date.now(),
        category: "brand",
      },
    };

    // Available nickname
    const availableResult = checkNicknameReservation("available", reservations);
    expect(availableResult.isReserved).toBe(false);
    expect(availableResult.canUse).toBe(true);

    // Reserved nickname
    const reservedResult = checkNicknameReservation("admin", reservations);
    expect(reservedResult.isReserved).toBe(true);
    expect(reservedResult.canUse).toBe(false);
    expect(reservedResult.category).toBe("admin");
    expect(reservedResult.reason).toBe("System reserved");
  });

  it("should create audit entries correctly", () => {
    // Test audit entry creation logic
    const auditEntry = createAuditEntry({
      jazzAccountId: "account-123",
      oldNickname: "oldname",
      newNickname: "newname",
      changedBy: "admin-user",
      source: "admin-cli",
      action: "update",
      reservationReason: "Brand protection",
      reservationCategory: "brand",
    });

    expect(auditEntry.monotonicId).toBeDefined();
    expect(auditEntry.timestamp).toBeGreaterThan(0);
    expect(auditEntry.jazzAccountId).toBe("account-123");
    expect(auditEntry.oldNickname).toBe("oldname");
    expect(auditEntry.newNickname).toBe("newname");
    expect(auditEntry.changedBy).toBe("admin-user");
    expect(auditEntry.source).toBe("admin-cli");
    expect(auditEntry.action).toBe("update");
    expect(auditEntry.reservationReason).toBe("Brand protection");
    expect(auditEntry.reservationCategory).toBe("brand");
  });

  it("should validate registry operations correctly", () => {
    // Test registry operation validation logic
    const currentRegistry = {
      existinguser: "account-123",
      anotheruser: "account-456",
    };

    const reservations = {
      reserved: {
        reservedBy: "system",
        reservedAt: Date.now(),
        category: "admin",
        reason: "System reserved",
      },
    };

    // Valid registration
    const validRegister = validateNicknameRegistryOperation(
      "register",
      "newuser",
      "account-789",
      currentRegistry,
      reservations,
    );
    expect(validRegister.isValid).toBe(true);

    // Invalid registration (already exists)
    const invalidRegister = validateNicknameRegistryOperation(
      "register",
      "existinguser",
      "account-789",
      currentRegistry,
      reservations,
    );
    expect(invalidRegister.isValid).toBe(false);
    expect(invalidRegister.errors).toContain("Nickname is already registered");

    // Invalid registration (reserved)
    const reservedRegister = validateNicknameRegistryOperation(
      "register",
      "reserved",
      "account-789",
      currentRegistry,
      reservations,
    );
    expect(reservedRegister.isValid).toBe(false);
    expect(reservedRegister.errors).toContain(
      "Nickname is reserved: System reserved",
    );

    // Valid update
    const validUpdate = validateNicknameRegistryOperation(
      "update",
      "existinguser",
      "account-123",
      currentRegistry,
      reservations,
    );
    expect(validUpdate.isValid).toBe(true);

    // Invalid update (wrong owner)
    const invalidUpdate = validateNicknameRegistryOperation(
      "update",
      "existinguser",
      "account-999",
      currentRegistry,
      reservations,
    );
    expect(invalidUpdate.isValid).toBe(false);
    expect(invalidUpdate.errors).toContain(
      "Cannot update nickname owned by different account",
    );
  });
});
