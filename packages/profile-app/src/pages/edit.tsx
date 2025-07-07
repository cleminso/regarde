import { useEffect } from 'react';

import { ProfileEditor } from '../components/editor/content';
import { useLayout } from '../pages/layoutContext';

export function EditorPage() {
  const { setShowHeader } = useLayout();

  useEffect(() => {
    setShowHeader(false);
    return () => setShowHeader(true);
  }, [setShowHeader]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ProfileEditor />
    </div>
  );
}
