

## Brand spelling rule: always "Rebase", never "ReBase"

### Status of the codebase
I searched the entire codebase for `ReBase`, `REBASE`, `reBase`, `Re-Base`, `Re-base`, `RE-BASE` — **no occurrences exist**. Every current reference uses the correct "Rebase" form.

### Action
This is a brand/style rule with no code change required right now. I'll save it to project memory so every future edit (UI copy, meta tags, alt text, JSON-LD, etc.) automatically conforms.

The rule will be added to **Core memory** (applied to every action, every file, every session):

> Brand name is always **"Rebase"** — never "ReBase", "REBASE", "Re-Base", "rebase" (in user-facing copy), or any other variant. Applies to UI text, meta tags, alt text, structured data, and component output. Lowercase `rebase-` prefixes in filenames and the `<rebase-services>` web component tag are unchanged (technical identifiers).

### Files touched
- `mem://style/brand-name` — new memory file with the rule
- `mem://index.md` — add a one-line Core entry referencing it

### Out of scope
- No source files need editing — current spelling is already correct everywhere.
- Asset filenames like `rebase-cryo.webp` and the `<rebase-services>` custom element name stay as-is (lowercase technical identifiers, not display copy).

