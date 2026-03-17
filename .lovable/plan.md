

# Fix: Glassmorphic Header on Scroll, Keep All Menu Items Visible

## Problem
Currently on scroll, the nav links (Experiences, About, Contact, Location) are hidden via `max-w-0 opacity-0` and the background becomes solid cream `bg-[#F9ECD9]`. The user wants all items to remain visible and the scrolled state to use a glassmorphic (frosted glass) background instead.

## Solution — `src/components/Navigation.tsx`

### 1. Remove the hide-on-scroll behavior (line 87)
Remove the conditional `max-w-0 opacity-0` / `max-w-[600px] opacity-100` classes from the nav items wrapper. Always show all items.

### 2. Glassmorphic scrolled background (line 67)
Replace `bg-[#F9ECD9]` with a frosted glass effect:
```
scrolled ? "bg-[#F9ECD9]/70 backdrop-blur-xl border-[#3B2712]/10" : "bg-transparent border-white/10"
```

### 3. Keep text color logic
The existing `textColor` / `textMuted` logic for dark text on scroll remains correct since the glassmorphic cream background still needs dark text for readability.

### Files to modify
- `src/components/Navigation.tsx` — lines 67 and 87

