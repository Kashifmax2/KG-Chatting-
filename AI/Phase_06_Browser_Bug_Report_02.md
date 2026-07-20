# Phase 06 Browser Bug Report (Round 2)

## Remaining Issues

### 1. Username consistency

The username display is inconsistent.

- Profile page shows only the username.
- Profile popup shows only the username.
- Dashboard footer still shows username#discriminator.

Use one consistent username display throughout the application according to AI/06_Friends_System.md.

---

### 2. Profile popup menu

The three-dot menu inside the profile popup card is still non-functional.

Implement or correctly wire the popup menu actions.

---

### 3. Message button

The Message button inside the profile popup does not work.

Clicking Message should:

- Open the existing DM if one already exists.
- Create a new DM if one does not exist.
- Navigate directly to that DM conversation.

---

### 4. Footer UI

Improve the footer user panel layout.

The secondary username text is unnecessarily truncated.

Improve spacing, alignment and responsive behavior while keeping the current design language.

---

## Notes

The unblock flow has been tested again.

Current behavior is acceptable.

Blocking removes the friendship.

Unblocking only removes the block.

Sending a new friend request afterward is expected behavior.

Do not change this behavior.

---

## Requirements

- Fix only these remaining Phase 06 issues.
- Do NOT start Phase 07.
- Run TypeScript build and production build after the fixes.
- Update AI/03_Phase_Status.md if necessary.
- Report every modified file.