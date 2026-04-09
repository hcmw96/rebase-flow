
# Always Show All Sessions (Remove Collapse)

## Change
In `src/components/booking/ClassScheduleFlow.tsx`, initialize `showAll` to `true` instead of `false` (line ~35). This makes all sessions visible by default while keeping the toggle if users want to collapse them.

Single line: `const [showAll, setShowAll] = useState(true);`

## File
- `src/components/booking/ClassScheduleFlow.tsx`
