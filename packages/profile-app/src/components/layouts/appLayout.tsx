import { Outlet } from 'react-router';

import { BaseLayout } from '#/components/layouts/baseLayout';

export function AppLayout() {
  return (
    <BaseLayout showHeader={true}>
      <Outlet />
    </BaseLayout>
  );
}
