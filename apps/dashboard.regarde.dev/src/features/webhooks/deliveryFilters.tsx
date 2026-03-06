"use client";

import { CalendarDays, ChevronDown } from "lucide-react";

import { Button } from "#ui/button";
import type { DeliveryFilters as Filters } from "./types";

interface DeliveryFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function DeliveryFilters({
  filters,
  onChange,
}: DeliveryFiltersProps): React.ReactElement {
  const handleStatusChange = (status: Filters["status"]) => {
    onChange({ ...filters, status });
  };

  const handleHttpChange = (httpResponse: Filters["httpResponse"]) => {
    onChange({ ...filters, httpResponse });
  };

  const handleEnvChange = (environment: Filters["environment"]) => {
    onChange({ ...filters, environment });
  };

  const handleEventTypeChange = (eventType: Filters["eventType"]) => {
    onChange({ ...filters, eventType });
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex h-8 items-center gap-2">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as Filters["status"])
            }
            className="h-full appearance-none rounded-sm bg-sidebar-accent py-1.5 pr-6 pl-2 font-sans text-sm text-foreground outline-none"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="retry">Retry</option>
            <option value="error">Error</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-foreground" />
        </div>

        {/* HTTP Response Filter */}
        <div className="relative">
          <select
            value={filters.httpResponse}
            onChange={(e) =>
              handleHttpChange(e.target.value as Filters["httpResponse"])
            }
            className="h-full appearance-none rounded-sm bg-sidebar-accent py-1.5 pr-6 pl-2 font-mono text-sm text-foreground outline-none"
          >
            <option value="all">All HTTP Responses</option>
            <option value="200">200 OK</option>
            <option value="400">400 Bad Request</option>
            <option value="500">500 Server Error</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-foreground" />
        </div>

        {/* Event Type Filter */}
        <div className="relative">
          <select
            value={filters.eventType}
            onChange={(e) =>
              handleEventTypeChange(e.target.value as Filters["eventType"])
            }
            className="h-full appearance-none rounded-sm bg-sidebar-accent py-1.5 pr-6 pl-2 font-mono text-sm text-muted-foreground outline-none"
          >
            <option value="all">All Type Events</option>
            <option value="order.created">Order Created</option>
            <option value="order.updated">Order Updated</option>
            <option value="subscription.created">Subscription Created</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-foreground" />
        </div>

        {/* Environment Filter */}
        <div className="relative">
          <select
            value={filters.environment}
            onChange={(e) =>
              handleEnvChange(e.target.value as Filters["environment"])
            }
            className="h-full appearance-none rounded-sm bg-sidebar-accent py-1.5 pr-6 pl-2 font-mono text-sm text-muted-foreground outline-none"
          >
            <option value="all">All Environment</option>
            <option value="production">Production</option>
            <option value="sandbox">Sandbox</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-foreground" />
        </div>
      </div>

      <div className="flex h-8 items-center gap-2">
        {/* Search Input */}
        <div className="flex h-full flex-col justify-center rounded-sm bg-sidebar-accent px-2 py-1.5">
          <p className="font-mono text-sm text-muted-foreground">
            Search Deliveries
          </p>
        </div>

        {/* Calendar Button */}
        <Button
          variant="outline"
          size="icon-xs"
          className="h-full w-8 rounded-sm bg-sidebar-accent"
        >
          <CalendarDays className="size-5" />
        </Button>
      </div>
    </div>
  );
}
