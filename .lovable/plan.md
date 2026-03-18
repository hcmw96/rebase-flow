

# Add "Join Our Community" Button Below Services Accordion

## Change

Add a glassmorphic CTA button below the services accordion on `/website` that links to sign up.

## Technical Details

**File: `src/components/WebsiteServices.tsx`** (lines ~369-371)

After the `</Accordion>` closing tag and before the section's closing `</div>`/`</section>`, insert a centered container with a `Link` to `/auth` (or `/signup`) containing a glassmorphic button styled consistently with the "Book Now" CTA:

- `bg-white/10 backdrop-blur-md border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-white/20`
- Tracking/letter-spacing to match brand aesthetic
- Padding and sizing for prominence
- Uses `react-router-dom` `Link` component

