import { useParams } from 'react-router';

import { ProfileView } from '#/components/profile/view';

export function ProfilePage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <ProfileView />
    </div>
  );
}
