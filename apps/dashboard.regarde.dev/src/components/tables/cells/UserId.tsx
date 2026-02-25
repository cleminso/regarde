interface UserIdProps {
  userId: string;
}

/**
 * Display a truncated user ID.
 *
 * @returns The user ID component
 */
export function UserId({ userId }: UserIdProps): React.ReactElement {
  const truncatedId = userId.substring(0, 12);

  return <span>{truncatedId}...</span>;
}
