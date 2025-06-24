const API_BASE_URL = 'http://api.jazz.dev';

interface UserDetails {
  jazzAccountId?: string;
  nickname?: string;
  requestedNickname?: string;
  exists?: boolean;
  error?: string;
  nicknameStatus?: {
    hasNickname: boolean;
    isRegistered: boolean;
    registrationDate?: string;
    canRegisterNickname: boolean;
  };
  publicData?: {
    name: string;
    bio?: string;
    avatar?: string;
    nickname?: string;
    socialLinks?: {
      github?: string;
      twitter?: string;
      website?: string;
    };
    projects?: Array<{
      title: string;
      year: string;
      client?: string;
      link?: string;
      description?: string;
    }>;
    workExp?: Array<{
      title: string;
      company: string;
      location?: string;
      url?: string;
      description?: string;
      from: string;
      to?: string;
    }>;
    writing?: Array<{
      title: string;
      year: string;
      publisher?: string;
      url?: string;
      description?: string;
    }>;
    education?: Array<{
      from: string;
      to?: string;
      degree: string;
      institution: string;
      location?: string;
      url?: string;
      description?: string;
    }>;
    certification?: Array<{
      issued: string;
      expire?: string;
      name: string;
      organization: string;
      url?: string;
      description?: string;
    }>;
    speaking?: Array<{
      title: string;
      year: string;
      event?: string;
      location?: string;
      url?: string;
      description?: string;
    }>;
    award?: Array<{
      title: string;
      year: string;
      presenter: string;
      url?: string;
      description?: string;
    }>;
    volunteering?: Array<{
      title: string;
      organization: string;
      location?: string;
      url?: string;
      description?: string;
      from: string;
      to?: string;
    }>;
  };
}

interface CheckAvailabilityResponse {
  nickname: string;
  available: boolean;
  takenBy?: string;
}

/**
 * Fetch user details by Jazz Account ID, nickname, or both for validation.
 *
 * @param options - Query options
 * @param options.accountId - The Jazz Account ID to look up (optional)
 * @param options.nickname - The registered nickname to resolve (optional)
 * @returns Promise resolving to user details including profile data and nickname status
 *
 * @example
 * // Fetch by account ID only
 * const user = await fetchUserDetails({ accountId: 'co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T' });
 *
 * @example
 * // Fetch by nickname only
 * const user = await fetchUserDetails({ nickname: 'john_doe' });
 *
 * @example
 * // Fetch with validation (nickname must be owned by account)
 * const user = await fetchUserDetails({
 *   accountId: 'co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T',
 *   nickname: 'john_doe'
 * });
 *
 * @throws {Error} When neither accountId nor nickname is provided
 * @throws {Error} When API request fails (excluding 400/404 which are handled as validation data)
 */
export async function fetchUserDetails(options: {
  accountId?: string;
  nickname?: string;
}): Promise<UserDetails> {
  const { accountId, nickname } = options;

  if (!accountId && !nickname) {
    throw new Error('Either accountId or nickname must be provided');
  }

  const searchParams = new URLSearchParams();
  if (accountId) {
    searchParams.append('jazzAccountId', accountId);
  }
  if (nickname) {
    searchParams.append('nickname', nickname);
  }

  const response = await fetch(
    `${API_BASE_URL}/users?${searchParams.toString()}`,
  );

  // Handle successful responses
  if (response.ok) {
    return response.json();
  }

  // Handle 400 and 404 as valid data for validation scenarios
  if (response.status === 400 || response.status === 404) {
    try {
      const data = await response.json();
      // Return any valid JSON data for frontend validation
      // The frontend validation logic will handle determining what to do with it
      return data;
    } catch (parseError) {
      console.warn('Failed to parse 400/404 response:', parseError);
      // Even if parsing fails, return a minimal object for frontend handling
      return {
        exists: false,
        jazzAccountId: '',
        nickname: undefined,
        requestedNickname: nickname,
        nicknameStatus: {
          hasNickname: false,
          isRegistered: false,
          canRegisterNickname: false,
        },
      };
    }
  }

  // Handle other error cases
  const errorData = await response
    .json()
    .catch(() => ({ message: 'Failed to fetch user details' }));
  console.error('API Error fetchUserDetails:', errorData);

  throw new Error(
    errorData.message ||
      errorData.error ||
      `Failed to fetch user details. Status: ${response.status}`,
  );
}

/**
 * Convenience function to fetch user details by Jazz Account ID only.
 *
 * @param accountId - The Jazz Account ID to look up
 * @returns Promise resolving to user details
 *
 * @example
 * const user = await fetchUserDetailsByAccountId('co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T');
 */
export async function fetchUserDetailsByAccountId(
  accountId: string,
): Promise<UserDetails> {
  return fetchUserDetails({ accountId });
}

/**
 * Convenience function to fetch user details by nickname only.
 * Resolves the nickname to an account ID internally.
 *
 * @param nickname - The registered nickname to look up
 * @returns Promise resolving to user details
 *
 * @example
 * const user = await fetchUserDetailsByNickname('john_doe');
 */
export async function fetchUserDetailsByNickname(
  nickname: string,
): Promise<UserDetails> {
  return fetchUserDetails({ nickname });
}

/**
 * Convenience function to fetch user details with nickname ownership validation.
 * Returns user details - check the response fields to determine validation status.
 *
 * @param accountId - The Jazz Account ID that should own the nickname
 * @param nickname - The nickname that should be owned by the account
 * @returns Promise resolving to user details with validation information
 *
 * @example
 * const user = await fetchUserDetailsWithValidation(
 *   'co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T',
 *   'john_doe'
 * );
 * // Check user.nickname vs user.requestedNickname and user.jazzAccountId for validation
 */
export async function fetchUserDetailsWithValidation(
  accountId: string,
  nickname: string,
): Promise<UserDetails> {
  return fetchUserDetails({ accountId, nickname });
}

/**
 * Validates if a nickname is owned by the specified account ID
 */
export function isNicknameOwnedByAccount(
  userDetails: UserDetails,
  accountId: string,
  requestedNickname: string,
): boolean {
  return (
    userDetails.jazzAccountId === accountId &&
    userDetails.nickname === requestedNickname
  );
}

/**
 * Gets the actual nickname owned by an account (if any)
 */
export function getAccountNickname(
  userDetails: UserDetails,
  accountId: string,
): string | null {
  if (userDetails.jazzAccountId === accountId && userDetails.nickname) {
    return userDetails.nickname;
  }
  return null;
}

/**
 * Determines the validation result for a nickname/account combination
 */
export function validateNicknameOwnership(
  userDetails: UserDetails,
  accountId: string,
  requestedNickname: string,
): {
  isValid: boolean;
  redirectTo?: string;
  reason: 'valid' | 'wrong_nickname' | 'not_owned' | 'not_found';
} {
  // Handle cases where userDetails might be partial (from 400/404 responses)
  if (!userDetails || typeof userDetails !== 'object') {
    return { isValid: false, reason: 'not_found' };
  }

  // Account owns the requested nickname
  if (isNicknameOwnedByAccount(userDetails, accountId, requestedNickname)) {
    return { isValid: true, reason: 'valid' };
  }

  // Account exists but owns a different nickname
  const actualNickname = getAccountNickname(userDetails, accountId);
  if (actualNickname && actualNickname !== requestedNickname) {
    return {
      isValid: false,
      redirectTo: actualNickname,
      reason: 'wrong_nickname',
    };
  }

  // Check if the response indicates the account ID doesn't match
  if (userDetails.jazzAccountId && userDetails.jazzAccountId !== accountId) {
    return { isValid: false, reason: 'not_owned' };
  }

  // Handle case where exists field is explicitly false
  if (userDetails.exists === false) {
    return { isValid: false, reason: 'not_found' };
  }

  // Handle cases where we have minimal data (e.g., error responses)
  if (!userDetails.jazzAccountId && !userDetails.nickname) {
    return { isValid: false, reason: 'not_found' };
  }

  // Default case
  return { isValid: false, reason: 'not_found' };
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<CheckAvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/checkAvailability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Failed to check nickname availability' }));
    console.error('API Error checkNicknameAvailability:', errorData);
    throw new Error(
      errorData.message ||
        `Failed to check nickname availability. Status: ${response.status}`,
    );
  }
  return response.json();
}

export async function updateUserNickname(
  accountId: string,
  newNickname: string,
  oldNickname?: string,
): Promise<boolean> {
  const payload: {
    jazzAccountID: string;
    nickname: string;
    oldNickname?: string;
  } = {
    jazzAccountID: accountId,
    nickname: newNickname,
  };
  if (oldNickname) {
    payload.oldNickname = oldNickname;
  }

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 204) {
    return true; // Success, no content
  } else if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Failed to update nickname' }));
    console.error('API Error updateUserNickname:', errorData);
    // Provide more specific error messages based on status codes if possible
    let errorMessage =
      errorData.message ||
      `Failed to update nickname. Status: ${response.status}`;
    if (response.status === 409) {
      errorMessage =
        errorData.error === 'Nickname already taken'
          ? 'This nickname is already taken.'
          : 'Conflict updating nickname.';
      if (
        errorData.error &&
        errorData.error.startsWith('Account already has a nickname:')
      ) {
        errorMessage = errorData.error;
      }
    } else if (response.status === 403) {
      errorMessage = "You're not allowed to perform this nickname update.";
    } else if (response.status === 400) {
      errorMessage = `Invalid request: ${errorData.error || 'Please check the nickname.'}`;
    }
    throw new Error(errorMessage);
  }
  // For other non-204 success codes, if any, or if response.ok but not 204
  return response.ok;
}
