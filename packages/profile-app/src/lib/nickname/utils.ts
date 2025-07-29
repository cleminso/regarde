// Determines if a nickname should be treated as a placeholder/empty
// Used to decide between "new registration" vs "update existing" flows

export function isPlaceholderNickname(nickname: string | undefined): boolean {
  return !nickname || nickname.trim() === '' || nickname === 'your-nickname';
}

// Validates nickname format according to business rules
// Separate from availability checking for better separation of concerns

export function isValidNicknameFormat(nickname: string): boolean {
  return (
    nickname.length >= 3 &&
    nickname.length <= 20 &&
    /^[a-zA-Z0-9_-]+$/.test(nickname)
  );
}
