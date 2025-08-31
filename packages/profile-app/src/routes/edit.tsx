import { ProfileEditor } from '../components/editor/content';
import { BaseLayout } from '../components/layouts/baseLayout';

export function EditorPage() {
  return (
    <BaseLayout showHeader={false}>
      <ProfileEditor />
    </BaseLayout>
  );
}
