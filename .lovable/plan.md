

## Fix: Bring Back Reflexology Services

### Problem
Reflexology services (programId 16, programName "Reflexology") are present in the API response but not appearing in the widget. After reviewing the code, the regex patterns and filtering logic are all correct -- the services should be displaying.

The most likely cause is that the recent edge function deployment (pagination fix) hasn't fully propagated yet, or there's a rendering issue related to how the "Touch & Flow/..." service names are being processed.

### Investigation Findings
- The API returns 10+ Reflexology services under programId 16 (e.g., "Touch & Flow/ Foot reflexology (60 mins)", "Flow & Glow/Facial & Foot Reflexology (90 mins)")
- The regex patterns on lines 60-62 correctly match these names and map them to the group name "Reflexology"
- "Reflexology" is NOT in the `hiddenGroupNames` set
- ProgramId 16 is NOT in the `hiddenProgramIds` set
- "Reflexology" has order position 40 in `serviceOrder`

### Plan
1. **Verify the edge function deployment** -- redeploy `mindbody-services` to ensure the pagination fix is live
2. **Add a safety net** -- add an explicit regex pattern for service names that start with "Touch & Glow" (with slash separator) to ensure all reflexology variant names are captured, since some use "/" directly after the ampersand phrase
3. **Test end-to-end** -- confirm Reflexology appears in the widget after deployment

### Technical Details
- Ensure all "Touch & Glow/..." variants (like "Touch & Glow/Cranial & Facial Reflexology") are captured by the existing pattern `/^touch\s*&\s*(flow|glow)/i` -- this pattern already handles both "flow" and "glow", so it should work
- If the issue persists, add a fallback pattern matching on programName "Reflexology" directly, so any service in that program is automatically grouped under "Reflexology" regardless of its name

