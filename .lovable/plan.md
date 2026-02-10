

# Add Contact Form to Account Page

## What changes
Add a minimal, elegant contact form at the bottom of the Account page (above Sign Out). The form will have name (pre-filled from profile), email (pre-filled), and a message field. On submit, it opens the user's mail client with the content addressed to `reception@rebaserecovery.com`.

No backend needed -- a simple `mailto:` link keeps it lightweight and functional.

## Design
- Appears between the "Visit Rebase Website" link and the Sign Out button
- Soft card with the same styling as the rest of the page
- Label: "Get in Touch" with a subtle subtitle
- Three fields: Name (pre-filled, readonly), Email (pre-filled, readonly), Message (textarea)
- Submit button opens `mailto:reception@rebaserecovery.com` with subject and body composed from the form fields
- Toast confirmation after sending
- Animated in with the same staggered `motion.div` pattern

## Technical details

### File: `src/pages/AccountPage.tsx`
- Add `useState` for `message` field
- Import `Textarea` from `@/components/ui/textarea`, `MessageSquare` from `lucide-react`, and `toast` from `sonner`
- Insert a new `motion.div` block (delay 0.25) between the links section and the logout button containing:
  - A card with "Get in Touch" heading and "Questions or feedback" subtitle
  - A single `<Textarea>` for the message (name and email pulled from profile automatically)
  - A submit button that constructs a `mailto:` URL: `mailto:reception@rebaserecovery.com?subject=Message from {name}&body={message}%0A%0AFrom: {name} ({email})`
  - Uses `encodeURIComponent` for safe URL encoding
  - Shows a toast on submit
- Adjust the Sign Out delay from 0.3 to 0.35

