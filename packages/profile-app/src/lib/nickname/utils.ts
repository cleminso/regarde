// Determines if a nickname should be treated as a placeholder/empty
// Used to decide between "new registration" vs "update existing" flows

export function isPlaceholderNickname(nickname: string | undefined): boolean {
  return !nickname || nickname.trim() === '' || nickname === 'your-nickname';
}

// Validates nickname format according to business rules
// Separate from availability checking for better separation of concerns

import { UserHandle } from "@regarde-dev/jazz-schemas/userHandle";

export function isValidNicknameFormat(nickname: string): boolean {
  try {
    UserHandle.shape.nickname.parse(nickname);
    return true;
  } catch {
    return false;
  }
}

export function getNicknameValidationError(nickname: string): string | null {
  try {
    UserHandle.shape.nickname.parse(nickname);
    return null;
  } catch (error: any) {
    return error.message || "Invalid nickname format";
  }
}
