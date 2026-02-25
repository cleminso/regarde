import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "#ui/tooltip";

interface TimestampCellProps {
  value: number;
}

/**
 * Display a timestamp in local time with UTC tooltip.
 *
 * @returns The timestamp cell component with tooltip
 */
export function TimestampCell({
  value,
}: TimestampCellProps): React.ReactElement {
  const localDate = new Date(value).toLocaleString();
  const utcDate = new Date(value).toISOString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{localDate}</TooltipTrigger>
        <TooltipContent>{utcDate}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
