import { Outlet } from 'react-router';

import { BaseLayout } from './baseLayout';

export function AppLayout() {
  return (
    <BaseLayout showHeader={true}>
      <Outlet />
    </BaseLayout>
  );
}
