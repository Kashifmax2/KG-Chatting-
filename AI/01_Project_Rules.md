# KG Chating - Global Development Rules

## Project

Project Name: KG Chating

This is NOT a Discord clone.

It is an original modern communication platform inspired by the best ideas from Discord, Slack, Telegram, WhatsApp and Messenger while having its own branding, UI, architecture and user experience.

---

# Mission

Build a production-ready application.

Every decision must prioritize:

- Stability
- Performance
- Scalability
- Security
- Accessibility
- Maintainability
- Real-time synchronization
- Excellent user experience

Never sacrifice code quality for speed.

---

# Existing Project

Continue from the current project.

Never recreate the application.

Never replace working code.

Never delete working features.

Always understand existing architecture before modifying anything.

Read the code first.

Then plan.

Then implement.

Then test.

---

# Required Stack

React
TypeScript
Vite
TailwindCSS
Zustand
React Router
Firebase Authentication
Cloud Firestore
Realtime Database
Firebase Storage
Cloudinary
Framer Motion

Never replace these technologies unless explicitly instructed.

---

# Coding Standards

Always use:

TypeScript strict mode

Reusable components

Reusable hooks

Reusable services

Reusable utility functions

Small functions

Single responsibility principle

Clean architecture

Feature-based structure

Avoid duplicated code.

---

# Folder Structure

Keep the project organized.

Separate

Components

Hooks

Services

Stores

Types

Utils

Config

Pages

Layouts

Providers

Assets

Icons

Animations

Never place Firebase code inside React components.

Always use service files.

---

# State Management

Use Zustand only.

Avoid unnecessary global state.

Keep local state local.

Never duplicate state.

Avoid derived state duplication.

---

# Performance

Prevent unnecessary renders.

Use memoization only where beneficial.

Avoid premature optimization.

Use lazy loading.

Use code splitting.

Virtualize large lists.

Batch updates.

Debounce search.

Throttle expensive operations.

---

# Firebase

Always use:

Service layer

Typed models

Transactions when required

Batch writes when required

Indexed queries

Realtime listeners with cleanup

Never leak listeners.

Never create duplicate listeners.

Always unsubscribe.

---

# Security

Never trust client data.

Validate all writes.

Use Firestore Security Rules.

Never expose secrets.

Use environment variables.

---

# UI Rules

Modern

Minimal

Professional

Responsive

Accessible

Consistent spacing

Consistent typography

Consistent colors

Smooth animations

Never copy Discord UI.

Create KG Chating identity.

---

# Testing

Every feature must be verified before completion.

Check:

No TypeScript errors

No console errors

No runtime errors

No memory leaks

No duplicate listeners

No failed Firebase requests

No UI glitches

No broken responsiveness

---

# Completion Requirements

Every completed task must include:

Files created

Files modified

Architecture explanation

Potential risks

Testing performed

Remaining work

Never leave TODO comments.

Never leave incomplete code.

Always finish the assigned phase completely.