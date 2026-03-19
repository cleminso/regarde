## Instructions

1. Use figma_mcp and refer to the select frame
2. Mention if there is any ambiguity that we must cover before start to design
3. Must use existing variables from `index.css`

## Dashboard layout

Our design system contain 3 majors elements:

1. `mainLayout` that wrap both `sidebar` and `mainContent`
2. `sidebar` for navigation
3. `mainContent` to display

The `mainLayout` is a container for `sidebar` and `mainContent`.

- has background applied
- has 0.25rem top padding (or gap) that give 4px gap from both `sidebar` and `mainContant`

### Sidebar Design

1. Sidebar container
   - 0.5rem (8px) gap between elements in content (`gap-2` on SidebarContent)
   - `rounded-tr-xs` top-right radius on inner container
2. Sidebar header
   - 0.5rem horizontal and vertical padding (`px-2 py-2`)
   - a div placeholder (empty, will hold logo) - temporary until logo is ready
   - a group of `moon` icon (theme toggle) and `SidebarTrigger` (collapse button), both use default sizing
3. SidebarContent has two SidebarGroup:
   - NavMain group at top with navigation items
   - Utility group at bottom with "Share feedback" and "Documentation" links
   - SidebarMenuButton with `p-2` padding (0.5rem all sides) - active state has blue right border
4. SidebarSeparator - not currently used
5. SidebarFooter
   - contain `appSwitcher`

### MainContent

1. Flex container with `gap-1` between header and content
2. Header with breadcrumb nav
   - `px-2 py-2` padding (0.5rem)
   - `rounded-bl-xs` bottom-left radius
   - bg-card background
3. Content area
   - `rounded-tl-xs` top-left radius
   - bg-card background
   - `p-4` padding
   - flex-1 with overflow-auto

## Responsive

### Mobile/Desktop Strategy

Use Tailwind default breakpoints with `md:` (768px) as the cutoff:

**Mobile (< 768px)**

- Fixed header with hamburger trigger + logo placeholder (no avatar yet)
- Sidebar rendered in Sheet overlay (18rem/288px width - wider than desktop for usability)
- Click outside to close
- App switcher included at bottom of mobile sidebar
- Breadcrumb navigation preserved in main content

**Desktop (≥ 768px)**

- Frame layout: sidebar + main content side by side with `gap-1`
- `bg-border` background on container with `pt-1` (0.25rem) top padding - gap shows through
- Sidebar has `rounded-tr-xs` top-right radius
- Main content has `rounded-tl-xs` top-left radius on content area
- Sidebar always visible, flex layout with `layout="flex"`

### Breakpoint

| Breakpoint | Value  | Purpose               |
| ---------- | ------ | --------------------- |
| sm         | 640px  | Small Devices         |
| md         | 768px  | Mobile/Desktop cutoff |
| lg         | 1024px | Laptops               |
| xl         | 1280px | Desktop               |

| Device Type | Screen Width  | Tailwind Class      |
| ----------- | ------------- | ------------------- |
| Mobile      | 0px-767px     | default             |
| Tablet      | 768px-1023px  | md:                 |
| Laptop      | 1024px-1279px | lg:                 |
| Desktop     | 1280px\*      | xl:                 |
