import { cn } from '#/lib/utils';

export type TabId = 'about' | 'now';

export interface Tab {
  id: TabId;
  label: string;
  enabled: boolean;
}

interface ProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  availableTabs: Tab[];
  className?: string;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  availableTabs,
  className,
}: ProfileTabsProps) {
  const enabledTabs = availableTabs.filter((tab) => tab.enabled);

  return (
    <div className={cn('', className)}>
      <nav className="flex space-x-4" aria-label="Profile sections">
        {enabledTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'font-mono text-md text-foreground duration-200',
              'hover:text-foreground',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export const DEFAULT_TABS: Tab[] = [
  {
    id: 'about',
    label: 'About',
    enabled: true,
  },
  {
    id: 'now',
    label: 'Now',
    enabled: true,
  },
];
