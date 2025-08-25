import { ProfileEditor } from '../components/editor/content';
import { BaseLayout } from '../components/layouts/baseLayout';

export function EditorPage() {
  return (
    <BaseLayout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <ProfileEditor />
      </div>
    </BaseLayout>
  );
}
