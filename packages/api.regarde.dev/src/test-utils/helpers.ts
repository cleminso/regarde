/**
 * Test utilities for api.regarde.dev - focused on business logic
 */

// Mock request/response helpers for testing API logic
export function createMockRequest(
  body: any,
  headers: Record<string, string> = {},
) {
  return {
    json: () => Promise.resolve(body),
    header: (name: string) => headers[name],
    headers: new Map(Object.entries(headers)),
  };
}

export function createMockContext() {
  const responseData: any = {};
  const responseStatus = { value: 200 };

  return {
    req: null, // Will be set by individual tests
    json: (data: any, status?: number) => {
      Object.assign(responseData, data);
      if (status) responseStatus.value = status;
      return Promise.resolve();
    },
    status: (code: number) => {
      responseStatus.value = code;
      return {
        json: (data: any) => {
          Object.assign(responseData, data);
          return Promise.resolve();
        },
      };
    },
    text: (text: string, status?: number) => {
      responseData.text = text;
      if (status) responseStatus.value = status;
      return Promise.resolve();
    },
    // Helper to get response data in tests
    getResponse: () => ({ data: responseData, status: responseStatus.value }),
  };
}

// Mock data factories for testing UR business logic
export function createMockRegistrationRequest(overrides = {}) {
  return {
    nickname: "testuser",
    RegardeTokenAuth: "valid-registration-key",
    accountId: "test-account-id",
    action: "register",
    ...overrides,
  };
}

export function createMockCheckAvailabilityRequest(overrides = {}) {
  return {
    nickname: "testuser",
    ...overrides,
  };
}

export function createMockUserDetailsRequest(overrides = {}) {
  return {
    nickname: "testuser",
    ...overrides,
  };
}

// Mock Jazz account for testing
export function createMockJazzAccount(overrides = {}) {
  return {
    id: "test-account-id",
    root: {
      "regarde.bio": {
        id: "test-profile-id",
        name: "Test User",
        userHandle: {
          nickname: "testuser",
          isActive: true,
          registeredAt: Date.now(),
          lastModified: Date.now(),
        },
        bio: "Test bio",
        version: 1,
      },
      "auth.regarde.bio": {
        key: "valid-registration-key",
        expiresAt: Date.now() + 3600000, // 1 hour from now
      },
    },
    ...overrides,
  };
}

// Mock worker account for testing
export function createMockWorkerAccount() {
  return {
    id: "worker-account-id",
    load: async (id: string) => {
      // Return mock data based on ID
      if (id === "test-account-id") {
        return createMockJazzAccount();
      }
      return null;
    },
  };
}
