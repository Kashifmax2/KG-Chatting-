# KG Chating
## Phase 07 — Presence System

Mission

Create a professional realtime presence system.

Presence must update instantly.

No manual refresh.

No page reload.

----------------------------------

Statuses

Online

Idle

Do Not Disturb

Invisible

Offline

Custom Status

----------------------------------

Automatic Presence

Browser Open

Browser Close

Tab Close

Refresh

Reconnect

Internet Lost

Internet Restored

Computer Sleep

Wake Up

Automatically update status.

----------------------------------

Realtime Database

Use RTDB for:

Presence

Heartbeat

Typing

Voice Sessions

Temporary realtime state

Mirror required fields to Firestore only when necessary.

----------------------------------

Heartbeat

Heartbeat every 30 seconds.

Detect stale users.

Auto Offline.

Auto Online.

No ghost users.

----------------------------------

Idle Detection

Mouse

Keyboard

Touch

Window Focus

Window Blur

Idle timeout configurable.

Return Online immediately after activity.

----------------------------------

Manual Status

Online

Idle

DND

Invisible

Manual status overrides automatic idle.

User choice persists.

----------------------------------

Last Seen

Update automatically.

Display:

Just now

5 minutes ago

1 hour ago

Yesterday

Date

Realtime updates.

----------------------------------

Sidebar Updates

Friend status

DM status

Profile status

Server member status

Conversation list

Everything updates instantly.

----------------------------------

Typing

Realtime typing

Auto stop typing

Cleanup on disconnect

Multiple typing users supported

----------------------------------

Security

Authenticated users only

Validate writes

Ownership validation

Rate limit updates

Disconnect cleanup

----------------------------------

Performance

Single listener per user

Reuse listeners

Cleanup subscriptions

Prevent duplicate heartbeats

No polling abuse

----------------------------------

Testing

Browser refresh

Multiple tabs

Disconnect

Reconnect

Internet loss

Sleep mode

Manual status

Idle

Invisible

Realtime updates

No memory leaks

No duplicate listeners

No console errors

----------------------------------

Deliverables

Files Created

Files Modified

Presence Architecture

RTDB Structure

Firestore Mirror

Security Summary

Performance Summary

Testing Results

Stop after Presence System is complete.