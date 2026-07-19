# KG Chating
## Phase 05 — User Profile System

Mission

Create a modern profile system.

Profiles update in real-time.

Every change syncs instantly.

----------------------------------

Profile Fields

UID

Username

Display Name

Bio

Avatar

Banner

Pronouns

Country

Language

Status

Custom Status

About Me

Website

Social Links

Badges

Created Date

Last Seen

Presence

Theme

Accent Color

Privacy Settings

----------------------------------

Avatar

Upload

Crop

Compress

Preview

Replace

Delete

Default avatar fallback

Cloudinary integration

----------------------------------

Banner

Upload

Crop

Compress

Preview

Delete

Cloudinary integration

----------------------------------

Realtime Updates

Display name

Avatar

Banner

Status

Bio

Username

Everything updates instantly.

No page refresh.

----------------------------------

Username Rules

Unique

Lowercase

3-32 characters

Letters

Numbers

Underscore

No spaces

No profanity

Cannot change too frequently

----------------------------------

Profile Privacy

Everyone

Friends

Nobody

Profile visibility

Status visibility

Activity visibility

Friend request settings

----------------------------------

Architecture

Profile Page

↓

Profile Store

↓

Profile Service

↓

Firestore

Never call Firestore inside components.

----------------------------------

Performance

Cache profile

Prevent duplicate listeners

Prevent memory leaks

Lazy load images

Compress uploads

Realtime sync

----------------------------------

Security

Validate uploads

Validate usernames

Validate display names

Validate URLs

Reject invalid data

Never trust client input

----------------------------------

UI

Discord-quality

Modern

Responsive

Accessible

Smooth animations

Loading skeletons

Error states

Empty states

----------------------------------

Testing

Realtime updates

Avatar updates

Banner updates

Status updates

Username changes

Offline mode

Reconnect sync

No duplicate listeners

No memory leaks

No TypeScript errors

----------------------------------

Deliverables

Files Created

Files Modified

Database Schema

Cloudinary Flow

Security Summary

Performance Summary

Next Phase Preparation

Stop after User Profile System is complete.