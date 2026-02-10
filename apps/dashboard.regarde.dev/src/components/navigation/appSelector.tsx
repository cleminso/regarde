import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

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
import { cn } from "#/lib/utils";

export function AppSelector(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const apps: string[] = [];
  const hasApps = apps.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={hasApps === false}
        >
          {value
            ? apps.find((app) => app === value)
            : hasApps
              ? "Select app"
              : "No apps"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search apps..." />
          <CommandList>
            <CommandEmpty>No apps found.</CommandEmpty>
            <CommandGroup>
              {apps.map((app) => (
                <CommandItem
                  key={app}
                  value={app}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === app ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {app}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
