# Theming Guide

Comprehensive theming and customization for shadcn/ui using OKLCH color format.

## CSS Variables (OKLCH Format)

shadcn/ui now uses **OKLCH** (Oklch color space) for CSS variables, providing better color accuracy and perceptual uniformity compared to HSL.

### Why OKLCH?

- **Perceptually uniform**: Changes in lightness correspond to predictable changes in perceived brightness
- **Better color accuracy**: More precise color representation
- **Wider gamut**: Access to more vivid colors
- **Standard in 2025**: Adopted with Tailwind v4 and modern browsers

### Complete Variable Set

```css
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);

    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);

    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);

    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);

    --secondary: oklch(0.961 0 0);
    --secondary-foreground: oklch(0.145 0 0);

    --muted: oklch(0.961 0 0);
    --muted-foreground: oklch(0.469 0 0);

    --accent: oklch(0.961 0 0);
    --accent-foreground: oklch(0.145 0 0);

    --destructive: oklch(0.602 0.22 29);
    --destructive-foreground: oklch(0.985 0 0);

    --border: oklch(0.914 0 0);
    --input: oklch(0.914 0 0);
    --ring: oklch(0.205 0 0);

    --radius: 0.5rem;
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);

    --card: oklch(0.145 0 0);
    --card-foreground: oklch(0.985 0 0);

    --popover: oklch(0.145 0 0);
    --popover-foreground: oklch(0.985 0 0);

    --primary: oklch(0.598 0.15 264);
    --primary-foreground: oklch(0.205 0 0);

    --secondary: oklch(0.175 0 0);
    --secondary-foreground: oklch(0.985 0 0);

    --muted: oklch(0.175 0 0);
    --muted-foreground: oklch(0.651 0 0);

    --accent: oklch(0.175 0 0);
    --accent-foreground: oklch(0.985 0 0);

    --destructive: oklch(0.306 0.15 29);
    --destructive-foreground: oklch(0.985 0 0);

    --border: oklch(0.175 0 0);
    --input: oklch(0.175 0 0);
    --ring: oklch(0.48 0.18 264);
  }
}
```

### Understanding OKLCH Syntax

```css
--color: oklch(L C H);
```

- **L (Lightness)**: 0 to 1 (0 = black, 1 = white)
- **C (Chroma)**: 0 to ~0.4 (0 = gray, higher = more vivid)
- **H (Hue)**: 0 to 360 degrees (color wheel angle)

**Examples:**
```css
--white: oklch(1 0 0);           /* Pure white */
--black: oklch(0 0 0);           /* Pure black */
--blue: oklch(0.598 0.15 264);   /* Vivid blue */
--red: oklch(0.602 0.22 29);     /* Vivid red */
```

## Dark Mode Implementation

### With next-themes

```bash
npm install next-themes
```

```typescript
// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Theme Toggle Component

```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Custom Colors

### Adding Brand Colors (OKLCH)

```css
:root {
  --brand: oklch(0.5 0.2 200);           /* Brand blue */
  --brand-foreground: oklch(1 0 0);      /* White text */
}

.dark {
  --brand: oklch(0.4 0.18 200);          /* Darker brand blue */
  --brand-foreground: oklch(1 0 0);      /* White text */
}
```

### Using Custom Colors

```typescript
// Add to button variants
brand: "bg-brand text-brand-foreground hover:bg-brand/90"
```

### Color Palette Examples

```css
/* Blue palette */
--blue-50: oklch(0.97 0.01 240);
--blue-500: oklch(0.55 0.22 260);
--blue-900: oklch(0.25 0.15 270);

/* Green palette */
--green-50: oklch(0.97 0.02 140);
--green-500: oklch(0.60 0.20 145);
--green-900: oklch(0.30 0.15 150);

/* Red palette */
--red-50: oklch(0.97 0.02 25);
--red-500: oklch(0.60 0.22 29);
--red-900: oklch(0.30 0.15 30);
```

## Border Radius

Adjust global border radius:

```css
:root {
  --radius: 0.5rem; /* Default */
}

/* More rounded */
:root {
  --radius: 0.75rem;
}

/* Less rounded */
:root {
  --radius: 0.25rem;
}

/* Square */
:root {
  --radius: 0;
}
```

## Component-Specific Customization

### Modifying Button Component

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Add custom variant with OKLCH
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
        brand: "bg-brand text-brand-foreground hover:bg-brand/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        // Add custom size
        xs: "h-7 px-2 text-xs",
      }
    }
  }
);
```

## Typography

### Font Configuration

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* globals.css */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans), sans-serif;
  }
  code {
    font-family: var(--font-mono), monospace;
  }
}
```

## Multiple Themes (OKLCH)

```css
/* Blue theme */
.theme-blue {
  --primary: oklch(0.533 0.22 260);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.7 0.15 250);
  /* ... */
}

/* Green theme */
.theme-green {
  --primary: oklch(0.45 0.20 145);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.7 0.15 140);
  /* ... */
}

/* Purple theme */
.theme-purple {
  --primary: oklch(0.58 0.22 300);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.7 0.15 290);
  /* ... */
}
```

```typescript
<body className={theme}>
  {children}
</body>
```

## Migrating from HSL to OKLCH

If you have existing HSL values, convert them to OKLCH:

### Online Tools
- Use https://oklch.com/ for HSL → OKLCH conversion
- Tailwind CSS v4 color tools

### Common Conversions

```css
/* HSL → OKLCH */
hsl(221, 83%, 53%) → oklch(0.598 0.15 264)  /* Blue */
hsl(0, 84%, 60%)   → oklch(0.602 0.22 29)   /* Red */
hsl(142, 71%, 45%) → oklch(0.60 0.20 145)   /* Green */
```

## Best Practices

1. **Use OKLCH for new projects**: Better color accuracy and perceptual uniformity
2. **Maintain contrast ratios**: Ensure accessibility (WCAG AA minimum 4.5:1)
3. **Test in dark mode**: Verify all colors work in both themes
4. **Consistent chroma values**: Use similar chroma for harmonious palettes
5. **Document custom colors**: Add comments explaining brand color choices
6. **Use CSS variables**: Leverage shadcn's variable system for consistency

## Browser Support

OKLCH is supported in:
- Chrome 111+
- Safari 15.4+
- Firefox 113+
- Edge 111+

For older browsers, Tailwind v4 provides automatic fallbacks.
