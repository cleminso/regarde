import { Outlet } from 'react-router';

import { BaseLayout } from './baseLayout.tsx';

export function AppLayout() {
  return (
    <BaseLayout showHeader={true}>
      <Outlet />
    </BaseLayout>
  );
}
