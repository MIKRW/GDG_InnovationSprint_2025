# Standard Carousel Page Layout

This document outlines the standard layout for pages that use a full-page, centered carousel for their main content, as established on the Bird Book (`/log`) page.

## Layout Structure

The layout consists of a main content area with five key regions: a central content area and four corner "hotspots" for navigation or secondary actions.

- **Main Component**: `AppLayout`
- **Content Wrapper**: The `<main>` element is a flex container that fills the available space (`flex-1`) and centers its content. Crucially, it must have `position: relative` to serve as the positioning context for the corner buttons.
- **Central Carousel**:
    - A `<Carousel>` component is placed in the center of the main content area.
    - It should have a defined `max-width` and `height` to ensure it fits within the viewport without overlapping other elements. A good starting point is `max-w-xl` and `h-[42rem]`.
    - It contains `<CarouselContent>` and one or more `<CarouselItem>` components, each holding a `Card`.
- **Carousel Navigation**:
    - Custom-styled `CarouselPrevious` and `CarouselNext` components are defined within the page file.
    - These buttons are absolutely positioned relative to the carousel to create large, easy-to-use-on-touch-devices targets.
    - A good starting point for styling is `h-32 w-32` for size and positioned `-right-40` or `-left-40` from the center. The `fill-ring` class allows them to adapt to the current theme.
- **Corner Buttons**: Four `<Link>`-wrapped `<Button>` components are absolutely positioned in the corners of the `<main>` element.
    - **Top-Left**: For contextual actions, like the `SpeakerButton`.
    - **Top-Right**: For global controls, like the `ContrastButton`.
    - **Bottom-Left**: For primary navigation, like the link to the `/log` page.
    - **Bottom-Right**: For primary navigation, like the link to the `/` (Home) page.
    - These buttons are styled with `variant="ghost"` and given a large size (`h-28 w-28`) and icon size (`h-20 w-20`) to make them easily tappable without being visually distracting (`opacity-50`).

## Example Implementation (`/log/page.tsx`)

```tsx
<AppLayout>
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
        
        {/* Top-Left Corner */}
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton ... />
        </div>

        {/* Top-Right Corner */}
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>

        {/* Central Carousel */}
        <Carousel className="w-full max-w-xl" opts={{ loop: false }}>
            <CarouselContent className="h-[42rem]">
                <CarouselItem>
                    <div className="p-1 h-full">
                        {/* Card Content Here */}
                    </div>
                </CarouselItem>
                {/* ... more items ... */}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>

        {/* Bottom-Left Corner */}
        <div className="absolute bottom-4 left-4 opacity-50">
            <Link href="/log">
                <Button variant="ghost" size="icon" className="h-28 w-28">
                    <BookImage className="h-20 w-20" />
                </Button>
            </Link>
        </div>

        {/* Bottom-Right Corner */}
        <div className="absolute bottom-4 right-4 opacity-50">
            <Link href="/">
                <Button variant="ghost" size="icon" className="h-28 w-28">
                    <Home className="h-20 w-20" />
                </Button>
            </Link>
        </div>

    </main>
</AppLayout>
```

This standardized layout provides a consistent, touch-friendly, and visually appealing structure for key pages of the application.