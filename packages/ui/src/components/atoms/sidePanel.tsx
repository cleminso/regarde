'use client'

import * as React from "react"
import { Drawer } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms/button"

interface SidePanelContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SidePanelContext = React.createContext<SidePanelContextValue>({
  open: false,
  onOpenChange: () => {},
})

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    checkMobile()
    const mq = window.matchMedia('(max-width: 768px)')
    mq.addEventListener('change', checkMobile)
    return () => mq.removeEventListener('change', checkMobile)
  }, [])

  return isMobile
}

function useSidePanel(): SidePanelContextValue {
  const context = React.useContext(SidePanelContext)
  if (context === undefined) {
    throw new Error("useSidePanel must be used within SidePanel.Provider")
  }
  return context
}

function Header({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex h-9 items-center gap-2 px-2 md:bg-background md:border-border md:border-b", className)} {...props}>
      {children}
    </div>
  )
}
Header.displayName = "SidePanelHeader"

function Content({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-auto p-2", className)} {...props}>{children}</div>
}
Content.displayName = "SidePanelContent"

function Footer({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 px-2 py-2 border-t", className)} {...props}>{children}</div>
}
Footer.displayName = "SidePanelFooter"

function Title({ className, children, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-sm font-medium text-foreground", className)} {...props}>{children}</h2>
}
Title.displayName = "SidePanelTitle"

function Description({ className, children, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props}>{children}</p>
}
Description.displayName = "SidePanelDescription"

export type CloseButtonProps = React.ComponentProps<typeof Button>

function CloseButton({ className, ...props }: CloseButtonProps) {
  const { onOpenChange } = useSidePanel()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => onOpenChange(false)}
      className={cn("flex-shrink-0 -ml-1", className)}
      {...props}
    >
      <XIcon />
      <span className="sr-only">Close</span>
    </Button>
  )
}
CloseButton.displayName = "SidePanelCloseButton"

function InlinePanel({
  children,
}: {
  children: React.ReactNode
}) {
  const { open } = React.useContext(SidePanelContext)

  return (
    <div
      className={cn(
        "flex-col bg-popover rounded-tl-xs h-full overflow-hidden flex-shrink-0",
        "transition-all duration-200 ease-in-out",
        open ? "w-[400px] opacity-100" : "w-0 opacity-0"
      )}
    >
      <div className="relative flex flex-col h-full w-[400px] overflow-auto">
        {children}
      </div>
    </div>
  )
}
InlinePanel.displayName = "SidePanelInline"

function DrawerPanel({
  children,
}: {
  children: React.ReactNode
}) {
  const { open, onOpenChange } = React.useContext(SidePanelContext)

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down" modal>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/10 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport className="fixed inset-x-0 bottom-0 z-50">
          <Drawer.Popup className="bg-popover shadow-lg flex flex-col w-full rounded-t-xl border-t max-h-[80vh] data-[ending-style]:translate-y-full">
            <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-muted" />
            <Drawer.Content className="relative flex flex-col overflow-auto p-4">
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
DrawerPanel.displayName = "SidePanelDrawer"

function Panel({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerPanel>{children}</DrawerPanel>
  }

  return <InlinePanel>{children}</InlinePanel>
}
Panel.displayName = "SidePanel"

function Provider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SidePanelContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </SidePanelContext.Provider>
  )
}
Provider.displayName = "SidePanelProvider"

const SidePanel = Object.assign(Panel, {
  Provider,
  useSidePanel,
  CloseButton,
  Header,
  Content,
  Footer,
  Title,
  Description,
})

export { SidePanel }
export default SidePanel
export type { SidePanelContextValue }
