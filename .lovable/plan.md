

## Replace all `white` references with `#F9ECD9` in AboutSection

Swap every `text-white`, `bg-white`, `border-white`, and `hover:bg-white` usage in `src/components/AboutSection.tsx` to use `[#F9ECD9]` instead.

### Changes in `src/components/AboutSection.tsx`

| Current | Replacement |
|---------|-------------|
| `text-white` | `text-[#F9ECD9]` |
| `text-white/90` | `text-[#F9ECD9]/90` |
| `text-white/80` | `text-[#F9ECD9]/80` |
| `text-white/60` | `text-[#F9ECD9]/60` |
| `bg-white/10` | `bg-[#F9ECD9]/10` |
| `bg-white/20` → hover | `bg-[#F9ECD9]/20` |
| `border-white/20` | `border-[#F9ECD9]/20` |
| `hover:bg-white/20` | `hover:bg-[#F9ECD9]/20` |

All instances are in the card title, subtitle, description, tagline, and Reserve button. Straightforward find-and-replace within the single file.

