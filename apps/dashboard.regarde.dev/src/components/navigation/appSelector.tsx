import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";
import { cn } from "#/lib/utils";
import { Button } from "#ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#ui/popover";

export function AppSelector(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { myApps, selectedAppId, isAccountReady } = useMyRegardeAccount();

  const handleSelect = (selectedAppIdValue: string): void => {
    // Navigate to overview page with new appId
    navigate({
      to: "/app/$appId/overview",
      params: { appId: selectedAppIdValue },
    });
    setOpen(false);
  };

  const selectedApp = myApps?.find((app) => app.$jazz.id === selectedAppId);

  if (isAccountReady === false || myApps === undefined) {
    return (
      <Button variant="outline" disabled className="w-full justify-between">
        <span className="text-gray-400">Loading apps...</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selectedApp?.name ?? "Select app"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search apps..." />
          <CommandList>
            <CommandEmpty>No apps found.</CommandEmpty>
            <CommandGroup>
              {myApps.map((app) => (
                <CommandItem
                  key={app.$jazz.id}
                  value={app.$jazz.id}
                  onSelect={() => handleSelect(app.$jazz.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAppId === app.$jazz.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {app.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
