# Phase 06 Browser Bug Report

## Functional fixes

1. If the specification does not explicitly require Discord's old discriminator system, display only the username instead of username#1234.

2. Blocked users cannot be unblocked. Add a working Unblock action.

3. Friends still have no working right-click context menu or three-dot menu. Implement the Phase 06 friend actions (View Profile, Message, Remove Friend, Block/Unblock, Copy Username, etc.) according to the specification.

---

## UI / UX Polish

While fixing these issues, improve the Friends System UI only.

- Improve spacing, padding and alignment.
- Fix overlapping elements.
- Improve avatar sizing and positioning.
- Improve friend list row layout.
- Improve search bar styling.
- Improve hover states and active states.
- Improve buttons.
- Improve context menu styling.
- Improve empty states.
- Improve loading skeletons.
- Improve animations and transitions.
- Keep the current design language.
- Do not redesign the application.
- Do not modify unrelated phases.
- Match Discord-quality polish.

---

## Important

- Fix only Phase 06 issues.
- Do NOT start Phase 07.
- Run TypeScript build and production build after the fixes.
- Report every modified file.