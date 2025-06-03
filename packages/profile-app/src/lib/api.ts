// packages/profile-app/src/lib/api.ts

const API_BASE_URL = ''; // Assuming APIs are served from the same origin or proxied

interface UserDetails {
  jazzAccountId: string;
  nickname?: string;
  exists: boolean;
  nicknameStatus: {
    hasNickname: boolean;
    isRegistered: boolean;
    registrationDate?: string; // Or Date
    canRegisterNickname: boolean;
  };
  publicData?: any; // Define further if needed
}

interface CheckAvailabilityResponse {
  nickname: string;
  available: boolean;
  takenBy?: string;
}

export async function fetchUserDetails(accountId: string): Promise<UserDetails> {
  const response = await fetch(`${API_BASE_URL}/users/${accountId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch user details" }));
    console.error('API Error fetchUserDetails:', errorData);
    throw new Error(errorData.message || `Failed to fetch user details for ${accountId}. Status: ${response.status}`);
  }
  return response.json();
}

export async function checkNicknameAvailability(nickname: string): Promise<CheckAvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/checkAvailability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to check nickname availability" }));
    console.error('API Error checkNicknameAvailability:', errorData);
    throw new Error(errorData.message || `Failed to check nickname availability. Status: ${response.status}`);
  }
  return response.json();
}

export async function updateUserNickname(accountId: string, newNickname: string, oldNickname?: string): Promise<boolean> {
  const payload: { jazzAccountID: string; nickname: string; oldNickname?: string } = {
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
    const errorData = await response.json().catch(() => ({ message: "Failed to update nickname" }));
    console.error('API Error updateUserNickname:', errorData);
    // Provide more specific error messages based on status codes if possible
    let errorMessage = errorData.message || `Failed to update nickname. Status: ${response.status}`;
    if (response.status === 409) {
        errorMessage = errorData.error === "Nickname already taken" ? "This nickname is already taken." : "Conflict updating nickname.";
        if (errorData.error && errorData.error.startsWith("Account already has a nickname:")) {
            errorMessage = errorData.error;
        }
    } else if (response.status === 403) {
        errorMessage = "You're not allowed to perform this nickname update.";
    } else if (response.status === 400) {
        errorMessage = `Invalid request: ${errorData.error || "Please check the nickname."}`;
    }
    throw new Error(errorMessage);
  }
  // For other non-204 success codes, if any, or if response.ok but not 204
  return response.ok;
}
