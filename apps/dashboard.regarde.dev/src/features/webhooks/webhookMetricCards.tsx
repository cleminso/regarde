import { cn } from "#lib/utils";

interface WebhookMetricCardProps {
  label: string;
  value: string | number;
}

function WebhookMetricCard({
  label,
  value,
}: WebhookMetricCardProps): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1.5 px-2 py-2.5">
      <p className="text-xs leading-4 text-muted-foreground">{label}</p>
      <p className="font-mono text-lg leading-6 text-foreground">{value}</p>
    </div>
  );
}

interface MetricsSectionProps {
  metrics: Array<{ label: string; value: string | number }>;
  className?: string;
}

export function MetricsSection({
  metrics,
  className,
}: MetricsSectionProps): React.ReactElement {
  return (
    <div className={cn("flex items-stretch gap-0 border-b", className)}>
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex flex-1 items-stretch">
          <WebhookMetricCard label={metric.label} value={metric.value} />
          {index < metrics.length - 1 && (
            <div className="w-px self-stretch bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}
