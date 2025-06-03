import { useIsAuthenticated } from 'jazz-react';
import { Link } from 'react-router';

import { Button } from '#/components/ui';

export function NotFoundPage() {
  const isAuthenticated = useIsAuthenticated();
  const homePath = isAuthenticated ? '/profile' : '/';

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 className="mb-8 text-lg font-sans">404 - Page Do Not Exist</h1>
      <p className="mb-4 text-lg font-sans">
        Sorry, the page you are looking for does not exist.
      </p>
      <p>
        You can come back home and jazz safely, clicking on the button below
      </p>
      <Link to={homePath}>
        <Button variant="default" className="mt-8">
          Back Home
        </Button>
      </Link>
    </div>
  );
}
