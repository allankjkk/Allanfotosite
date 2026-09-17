# TECHNICAL_SPEC — Allan Dantas Photography Portfolio

## 1. Source, status, and boundaries

This specification consolidates the technical decisions in **Criar portfólio fotográfico**, conversation `6aa44389-2cbc-83e9-b3a6-2aaed8096360`, and the current documentation request. Companion documents: [PRD.md](PRD.md) and [UI_SPEC.md](UI_SPEC.md).

Only the agreed MVP/v1 is specified. Later decisions supersede earlier alternatives: Supabase instead of separately assembled infrastructure; no ORM; no nested project folders; private settings and inquiries accessed through the server; JPEG/WebP input; UUID-based storage paths; and essential security without the additional defenses explicitly deferred by the user.

The schema and access intentions are established. Exact RLS policies and some image-processing execution details remain implementation work. The SQL below is a consolidated schema reference, not a claim that a complete production migration or deployment has been tested.

Documentation is English; the public and administrative interfaces remain in Brazilian Portuguese.

## 2. Technology stack

| Layer | Agreed technology and responsibility |
|---|---|
| Application | Next.js with React and TypeScript; public website and Admin in one application. |
| Styling | Tailwind CSS; dedicated CSS only for necessary custom composition. |
| Server interaction | Server Actions for application-driven mutations; Route Handlers when an HTTP endpoint is actually needed. |
| Validation | Zod, including server-side validation. |
| Database | Supabase PostgreSQL. |
| Authentication | Supabase Auth for administrator email/password and sessions. |
| Object storage | Supabase Storage for private temporary uploads and processed portfolio images. |
| Data client | Official Supabase SDK, encapsulated in repositories. |
| Image processing | Sharp on the server side. |
| Deployment | Vercel, initially using a `.vercel.app` address. |

Use the Next.js image-delivery facilities for responsive delivery where appropriate. The persisted portfolio version is already processed by the application; delivery optimization does not replace watermarking or metadata handling.

No framework/package versions were pinned in the conversation. This document does not invent them. Production Tailwind belongs in the build, rather than the earlier HTML prototype's CDN setup.

Not included: Prisma/Drizzle or another ORM, Redux, a separate backend/API application, Docker, microservices, or unnecessary abstraction layers. A future need may justify revisiting these choices.

## 3. Architecture and responsibilities

### 3.1 Mutation path

```text
Components
    ↓
Server Actions / necessary Route Handlers
    ↓
Authentication + authorization + Zod validation
    ↓
Services
    ↓
Repositories
    ↓
Supabase
```

| Layer | Responsibility |
|---|---|
| Components | Render information, collect input, and display progress/results. |
| Actions/handlers | Establish a trusted server entry point, validate input, enforce authorization where required, invoke services, and return appropriate UI results. |
| Zod schemas | Validate input shape, required fields, supported values, and agreed limits. |
| Services | Enforce publication rules, cover ownership, lifecycle rules, phone normalization, and image-processing orchestration. |
| Repositories | Encapsulate Supabase reads/writes and storage access; do not scatter SDK queries throughout React components. |
| Supabase | Persist relational data, manage authentication, and store objects. |

Administrative checks must happen on the server for every protected operation; hiding a button is insufficient.

### 3.2 Read path

Public page reads can follow:

```text
Next.js Server Component → Service → Repository → Supabase
```

A read does not need a Server Action solely to satisfy the mutation diagram. The public repository must restrict projects to:

```sql
status = 'PUBLISHED' AND deleted_at IS NULL
```

Photo reads must also exclude trashed photos and require an eligible parent project. Apply the same eligibility to direct slug access, not only portfolio listings.

The browser does not freely query application tables. Direct authorized browser-to-Storage upload is a deliberate exception for file transfer, not permission to bypass application authorization.

### 3.3 Server Actions and Route Handlers

Use Server Actions for project creation/editing/publication, deactivation, Trash operations, inquiry-status changes, settings updates, and public contact submission.

Use Route Handlers only for workflows that need an HTTP endpoint, including upload coordination if required by the final implementation. Do not build a complete REST CRUD API merely because the application has server-side behavior. Future webhooks/integrations do not require endpoints in v1.

## 4. Folder structure

The following consolidates the agreed organization. It describes the target structure, not files already implemented.

```text
allan-portfolio/
├── public/
│   ├── icons/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── portfolio/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── sobre/page.tsx
│   │   │   └── contato/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── projetos/
│   │   │   ├── mensagens/
│   │   │   ├── lixeira/
│   │   │   └── configuracoes/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── portfolio/
│   │   ├── contact/
│   │   └── admin/
│   ├── features/
│   │   ├── projects/
│   │   │   ├── project.actions.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.repository.ts
│   │   │   ├── project.schema.ts
│   │   │   └── project.types.ts
│   │   ├── photos/
│   │   │   ├── photo.actions.ts
│   │   │   ├── photo.service.ts
│   │   │   ├── photo.repository.ts
│   │   │   ├── photo.schema.ts
│   │   │   ├── photo.types.ts
│   │   │   ├── image-processor.ts
│   │   │   └── watermark.ts
│   │   ├── contacts/
│   │   └── settings/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils/
│   └── middleware.ts
├── .env.local
├── package.json
├── tsconfig.json
└── next.config.ts
```

Contacts/settings follow the same feature separation where needed. `(public)` is a route group and does not appear in URLs. `/api` contains only necessary endpoints. `middleware.ts` represents the planned session-entry guard; verify the applicable framework convention when selecting the actual Next.js version. It never replaces per-operation authorization.

Shared components include Header, Footer, Admin navigation, project presentation, gallery, contact form, and upload UI. Component names such as ProjectCard do not imply rounded visual cards.

## 5. Data model

Application-owned tables: `projects`, `photos`, `contact_requests`, `site_settings`, and `admin_users`. `auth.users` is managed by Supabase Auth.

```text
Supabase auth.users ── 1:0..1 ── admin_users

projects ── 1:N ── photos
    └── optional cover_photo_id → photos.id

contact_requests
site_settings (one global record)
```

### 5.1 projects

| Field | Type / constraint | Meaning |
|---|---|---|
| id | UUID primary key | Stable project identity. |
| title | Required text | Project title. |
| slug | Required unique text | Public URL segment. |
| category | Required text | Category; no category table in v1. |
| year | Optional integer | Only supplied/confirmed project year. |
| description | Optional text | Project description. |
| status | project_status, default DRAFT | DRAFT, PUBLISHED, INACTIVE. |
| cover_photo_id | Optional UUID FK | Cover photo reference. |
| display_order | Integer, default 0, nonnegative | Editorial ordering. |
| created_at | timestamptz, default now() | Creation time. |
| updated_at | timestamptz, default now() | Last update time. |
| deleted_at | Optional timestamptz | Trash marker. |

`ProjectService` checks that the cover belongs to the project and is available. Publication also requires an available photo and a non-trashed project. No `layout`/`layout_type` field is included.

### 5.2 photos

| Field | Type / constraint | Meaning |
|---|---|---|
| id | UUID primary key | Photo identity. |
| project_id | Required UUID FK | Parent project; physical deletion cascades. |
| storage_path | Required text | Processed object path, not a hard-coded full URL. |
| width / height | Optional positive integers | Processed dimensions. |
| alt_text | Optional text in schema | Contextual alternative text, editable in Admin. |
| display_order | Integer, default 0, nonnegative | Gallery order. |
| created_at | timestamptz, default now() | Creation time. |
| deleted_at | Optional timestamptz | Trash marker. |

Each photo belongs directly to one project. There are no nested albums or folders. Schema nullability of alt text does not remove the accessibility requirement to provide meaningful alternative text for relevant public photographs.

### 5.3 contact_requests

| Field | Type / constraint | Meaning |
|---|---|---|
| id | UUID primary key | Internal inquiry identity. |
| name | Required text | Sender name. |
| phone | Required text | Normalized mobile number. |
| message | Required text | Inquiry body. |
| status | contact_status, default NEW | NEW, VIEWED, IN_CONTACT, FINISHED. |
| created_at / updated_at | timestamptz, default now() | Received/updated times. |

No deletion/Trash interface for inquiries in v1. Finished inquiries remain in history.

### 5.4 site_settings

One global record containing:

| Field | Type |
|---|---|
| id | UUID primary key |
| name | Required text |
| instagram | Optional text |
| instagram_url | Optional text |
| whatsapp | Optional text |
| email | Optional text |
| location | Optional text |
| copyright | Optional text |
| watermark_text | Optional text |
| updated_at | timestamptz, default now() |

Admin reads/updates this record; the panel does not create/delete settings records. The singleton is an application/setup rule in the agreed schema, not an additional SQL constraint already established in the conversation.

No passwords, Supabase secrets, or Vercel configuration belong in this table. Public rendering receives selected values through the application server, never direct table access.

### 5.5 admin_users

| Field | Type / constraint |
|---|---|
| user_id | UUID primary key referencing auth.users(id), physical deletion cascades |
| created_at | timestamptz, default now() |

Membership means administrator authorization. There is no roles hierarchy in v1. Email/password storage remains Supabase Auth's responsibility.

## 6. Consolidated v1 SQL/schema reference

Create projects before photos, then attach the cover FK to resolve the circular reference. The following reproduces the agreed schema, essential indexes, and RLS activation. It intentionally does not invent final policies.

```sql
create type project_status as enum ('DRAFT', 'PUBLISHED', 'INACTIVE');
create type contact_status as enum ('NEW', 'VIEWED', 'IN_CONTACT', 'FINISHED');

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  year integer,
  description text,
  status project_status not null default 'DRAFT',
  cover_photo_id uuid,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint projects_display_order_check check (display_order >= 0)
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  width integer,
  height integer,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint photos_width_check check (width is null or width > 0),
  constraint photos_height_check check (height is null or height > 0),
  constraint photos_display_order_check check (display_order >= 0)
);

alter table projects
  add constraint projects_cover_photo_fk
  foreign key (cover_photo_id) references photos(id) on delete set null;

create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text not null,
  status contact_status not null default 'NEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instagram text,
  instagram_url text,
  whatsapp text,
  email text,
  location text,
  copyright text,
  watermark_text text,
  updated_at timestamptz not null default now()
);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_projects_status on projects(status);
create index idx_projects_display_order on projects(display_order);
create index idx_photos_project_id on photos(project_id);
create index idx_photos_display_order on photos(display_order);
create index idx_contact_requests_status on contact_requests(status);

alter table projects enable row level security;
alter table photos enable row level security;
alter table contact_requests enable row level security;
alter table site_settings enable row level security;
alter table admin_users enable row level security;
```

The unique slug constraint already supplies its supporting unique index. `NOT NULL` does not replace Zod validation of empty/invalid input. `updated_at` defaults only initialize timestamps; subsequent updates must maintain them in application writes unless the implementation deliberately revisits that decision. Complex triggers were not part of the agreed base.

The cover FK alone does not enforce same-project ownership, availability, or publication validity. These belong in `ProjectService`. Database cascades remove relational records, not Supabase Storage objects.

Before execution, convert this reference and the finalized access policies into a reviewed migration. Do not treat RLS activation alone as completed policy implementation.

## 7. Authentication and administration

### 7.1 Initial setup

1. Create the administrator account directly in Supabase Auth.
2. Disable public signup.
3. Add the actual Auth UUID to `admin_users` through trusted setup.
4. Create the single `site_settings` record.
5. Configure authentication URLs for the actual application deployment.

Never hard-code the administrator password, store it in application tables, commit it, or place it in environment variables as an application login mechanism. Supabase Auth manages the credential.

Confirmed initial public values:

| Setting | Value |
|---|---|
| name | Allan Dantas |
| instagram | @allan.pht |
| instagram_url | https://instagram.com/allan.pht |
| location | João Pessoa — PB |
| copyright | © Allan Dantas |
| watermark_text | ✳· ALLAN DANTAS |

Professional WhatsApp and email remain unconfirmed. Do not insert fictional values. Alternative Instagram handles discussed earlier were not adopted.

### 7.2 Access flow

```text
/admin
  → no valid session: administrative login
  → valid session: verify admin_users membership
  → authorized: Dashboard
  → unauthorized: deny administrative access
```

A shared server-side guard, conceptually `requireAdmin()`, verifies the Auth user and authorized membership before protected operations. The route-entry session guard is only one layer. No public Admin/Login navigation, signup, social login, or administrator management is included. Keep administrative pages out of indexing without treating that as authorization.

## 8. RLS and server-side data access

### 8.1 Permission intentions

| Resource | Public visitor | Authorized Admin through protected operations |
|---|---|---|
| Published projects/photos | Read server-rendered eligible content | Read/create/update; Trash and permanent deletion |
| Draft/inactive/trashed content | No public application access | Manage and privately preview as appropriate |
| contact_requests | Submit through validated server operation only; no direct SELECT/INSERT/UPDATE/DELETE | SELECT and UPDATE status; no panel deletion |
| site_settings | No direct table access of any kind | SELECT and UPDATE the global record |
| admin_users | No access | Not managed through the panel; trusted setup controls membership |
| Temporary upload storage | No access | Authorized upload; server reads/processes/deletes |
| Processed portfolio storage | Public delivery of processed web assets | Controlled administrative file lifecycle |

### 8.2 Implementation requirements and limits

- Enable RLS on all five application tables.
- Do not restore the superseded proposal granting public direct settings SELECT or direct inquiry INSERT.
- Public data reads go through server-side services/repositories with explicit eligibility filters.
- Privileged credentials must remain server-only.
- Operations using credentials that bypass RLS must enforce authorization and filtering in server code; RLS must not be described as an independent barrier for such privileged calls.
- Authenticated-session database access must receive only the intended permissions.
- Finalize the safe authorization check during Supabase setup. Avoid a policy on `admin_users` that recursively depends on reading the same protected table.
- Whether the check is encapsulated safely in the database or carried out through the chosen trusted backend path remains to be resolved alongside actual policies.
- Storage policies must authorize the direct upload flow without granting anonymous upload access.

### 8.3 Processed-file visibility boundary

The conversation selected private temporary/original storage and public processed web versions. Database filtering controls which projects appear in the website, but is not a guarantee that an already-known public Storage object URL becomes inaccessible when a project is deactivated or trashed.

Strict revocation of processed image URLs for drafts, inactive projects, or Trash was not resolved by the agreed public-storage design. Do not claim it is implemented. If strict asset privacy is required, its delivery policy must be decided before implementation; this document does not silently introduce signed private delivery as an approved v1 feature.

## 9. Project lifecycle and soft deletion

| Action | Behavior |
|---|---|
| Create | Save as DRAFT. |
| Publish | Verify project is not trashed and has an available photo and valid cover; set PUBLISHED. |
| Deactivate/unpublish | Remove from public selection while preserving data/photos; use the INACTIVE state for deactivation. |
| Trash project | Set projects.deleted_at; public reads exclude it and its photos. |
| Trash photo | Set photos.deleted_at; retain the object for restoration. |
| Restore | Clear the item's deleted_at; other status/parent/photo visibility rules still apply. |
| Permanently delete photo | Remove its record and relevant stored object after confirmation. |
| Permanently delete project | Remove project, associated photo records, and corresponding objects after confirmation. |

Trashing a project does not physically cascade to photos. Restoring it must not implicitly undo an individual photo's own Trash marker. No automatic cleanup is included.

Service orchestration must account for both database and object-storage changes; a relational cascade alone does not delete files. The exact partial-failure/retry strategy for permanent deletion remains an implementation detail, not an approved queueing/auditing subsystem.

The conversation did not finalize removal of the current cover from a published project, replacement of the last available photo, or restoration beyond the photo limit. Resolve these against the existing publication/limit rules without inventing silent behavior.

## 10. Storage architecture

Logical areas:

```text
Private temporary area
└── authorized administrative uploads

portfolio/
└── {project_id}/
    ├── {photo_uuid}.webp
    └── ...
```

The final path uses stable UUIDs, not slugs or original filenames. Renaming a title/slug does not require moving image objects. Store `storage_path` in PostgreSQL; resolve delivery URLs through the storage integration.

Temporary/original files are private. The processed area contains only web-sized, optimized, watermarked images with sanitized authorship/copyright metadata. RAW files and full-resolution delivery originals remain outside the portfolio's archival responsibility.

The logical private/public separation must be backed by actual Storage access configuration; folder naming alone is not access control. Exact bucket names and policies are setup details.

## 11. Upload and image-processing pipeline

### 11.1 Agreed limits

| Item | Initial v1 decision |
|---|---|
| Input | JPEG and WebP |
| Excluded input | PNG, RAW/CR2, TIFF, PSD |
| Maximum per file | 25 MB |
| Recommended project selection | Approximately 15 photos; fewer allowed |
| Initial project maximum | 20 photos |
| Transport | Direct/resumable browser upload to Supabase Storage using TUS |
| Processing | Sharp on the server side |
| Stored web output | WebP |
| Starting dimensions | Approximately 2000 px on the longest side; preserve aspect ratio |
| Fixed output file weight | None; optimize dimensions/quality rather than forcing identical byte sizes |

Validate the agreed limits server-side as well as in the interface. The exact treatment of trashed photos in count limits and concurrent uploads/restoration remains to be finalized; do not silently allow the project limit to be bypassed.

### 11.2 Processing sequence

```text
Authorized Admin selects files
    ↓
Validate supported input and limits
    ↓
Authorize direct/resumable upload
    ↓
Browser → private Supabase temporary area
    ↓
Server-side processing
    ├── validate received image
    ├── correct orientation
    ├── resize proportionally (~2000 px longest side)
    ├── sanitize metadata
    ├── preserve/reapply authorship and copyright
    ├── composite ✳· ALLAN DANTAS
    └── encode optimized WebP
    ↓
Save portfolio/{project_id}/{photo_uuid}.webp
    ↓
Persist photo path, dimensions, order, alt text, project_id
    ↓
Confirm successful result
    ↓
Delete temporary original
    ↓
Report photo ready
```

Vercel coordinates authorization/application behavior rather than receiving the full batch of original JPEGs in the initial upload request. Direct upload is still authenticated and authorized.

TUS provides resumable transport and individual progress. Each file can be waiting, uploading, processing, ready, or failed. Retry a failed file without losing successful files. Transfer completion must not be reported as processing completion.

Do not delete the temporary source before the generated result and its metadata have been successfully persisted. Handling abandoned/failed temporary uploads requires an implementation decision; an automatic cleanup service was not established as a v1 feature.

### 11.3 Quality and watermark

Start with approximately 2000 px on the longest side. Compare real photographs at candidate quality settings such as 80/85/90 before selecting the final WebP quality. These are calibration candidates, not three required variants.

Watermark text comes from `site_settings.watermark_text`, initially **✳· ALLAN DANTAS**. Apply it proportionally with a discreet opacity and border margin, suitable for portrait and landscape images. Exact size, margin, and opacity are not finalized.

The generated public image contains the watermark. The original on the administrator's computer remains unchanged. Do not add mandatory AVIF variants, permanent originals, or paid Supabase image-transform dependencies; the final decision was application-owned Sharp processing and WebP storage.

### 11.4 Metadata

Sanitize metadata instead of indiscriminately preserving it or deleting all authorship information.

Preserve/reapply the agreed public identity information where supported by the output pipeline:

- Creator/author: Allan Dantas.
- Credit: Allan Dantas.
- Copyright: the configured copyright value.
- Professional social identification: the confirmed/configured Instagram value.

Remove GPS coordinates, camera serial numbers, and other sensitive or unnecessary metadata. Verify the actual generated WebP metadata during implementation; do not assume that decoding/re-encoding automatically preserves the desired fields.

New uploads use updated settings. Automatic retrospective reprocessing of existing photos was not included.

### 11.5 Execution detail still open

Sharp and server-side processing are selected, but the exact worker/function execution arrangement, batch concurrency, timeout/memory behavior, and retry persistence were not finalized. Validate the intended environment with real files before choosing the smallest suitable implementation.

The conversation discussed provider limits and free tiers as architecture context. This document does not present those time-sensitive historical values as current guarantees or as new project requirements. Recheck actual provider/runtime constraints during implementation; do not add a queue, worker service, or paid plan by assumption.

## 12. Contact processing

```text
Public form
    ↓
Server Action
    ↓
Zod validation
    ↓
Normalize Brazilian mobile number
    ↓
ContactService
    ↓
Repository
    ↓
contact_requests, status NEW
    ↓
Public success response
```

Required inputs: name, mobile/WhatsApp number, and message. Assume Brazil/+55 for the initial audience. Store an international normalized number, format it for display, and use digits without spaces/parentheses/hyphens in the WhatsApp destination.

The response confirms submission without returning internal record IDs/status metadata unnecessarily. Phone validation does not verify a WhatsApp account. Do not add a client email requirement or automatic messaging.

Admin can read inquiries and update status. The discussed interaction marks `NEW` as `VIEWED` on opening; subsequent contact/completion states are managed by Admin. Finished inquiries remain stored.

Zod schemas must reject missing/invalid input. Exact text-length constraints were illustrated but not finalized, so this document does not turn example minimums into approved requirements.

## 13. Deployment strategy

### 13.1 Initial target

One Next.js application on Vercel, with Supabase PostgreSQL/Auth/Storage. Start with the Vercel-provided `.vercel.app` address. No exact hostname is confirmed, and a custom domain is optional future work.

### 13.2 Setup and release sequence

1. Initialize the repository and Next.js/TypeScript/Tailwind application using the agreed structure.
2. Create/configure the Supabase project.
3. Finalize and apply the v1 migration and reviewed RLS/Storage policies.
4. Create the Auth administrator, authorized membership, and single settings record.
5. Configure server/client Supabase integration with appropriately separated credentials.
6. Configure local environment variables; exclude `.env.local` from version control.
7. Implement public pages, Auth/Admin, project lifecycle, image pipeline, inquiries, and settings.
8. Validate the image execution path against the real hosting environment and real input photos.
9. Deploy to Vercel and configure production environment variables and allowed Auth URLs for the actual hostname.
10. Check public routes, direct slug eligibility, administrative authorization, upload/processing, contact submission, and Trash behavior in the deployed environment.
11. Replace placeholders and supply confirmed contact/content values before launch.

The final SQL conversation noted that the Supabase project had not yet been created. This documentation does not imply that the setup or migration has run.

### 13.3 Verification scope

Verify the PRD acceptance criteria with focused checks for publication prerequisites, cover ownership, phone normalization, input limits, unauthorized operations, public filtering, and Trash/storage coordination. Exercise the complete public and administrative flows, responsive layouts, and generated image quality/metadata.

Also verify type correctness, successful production build, and applicable lint checks. Earlier discussions mentioned testing tools, but the final stack block did not finalize a testing-library selection; this specification does not expand the stack solely to formalize one.

## 14. Essential security versus deferred work

Required in v1:

- Supabase Auth plus explicit administrator authorization.
- Protected server operations and validated public contact submission.
- RLS and restricted table access consistent with the actual credential model.
- Private temporary uploads and authorized direct upload.
- Processed web-only image delivery, metadata sanitization, and original cleanup after success.
- Server-only secrets, environment configuration, and no committed credentials.

Deferred by explicit scope correction:

- Rate limiting and advanced anti-spam.
- CAPTCHA and additional login-attempt protections.
- Auditing, advanced custom logs, and change history.
- Complex roles/permissions, realtime notifications, and unnecessary triggers/procedures.

No promise of absolute image-copy prevention is made. Reduced resolution, copyright, watermark, and drag/context-menu deterrents implement the agreed protection approach.

## 15. Remaining implementation decisions

| Topic | Boundary |
|---|---|
| Exact RLS policies | Finalize against actual session/privileged credential paths and avoid recursive authorization policies. |
| Processing execution | Validate Sharp runtime, limits, concurrency, and retry handling with actual hosting/files. |
| Image calibration | Choose final quality, dimensions, watermark size/margin/opacity from real photo comparisons. |
| Public Storage visibility | Do not confuse hidden projects with revoked access to already-public processed object URLs. |
| Lifecycle edge cases | Resolve current-cover/last-photo removal, restoration over limits, and partial database/storage failures. |
| Temporary failures | Define recovery/cleanup behavior without assuming a new automated subsystem. |
| Content | Obtain unconfirmed contact values, biography, photo selection, and project years. |

These items must be addressed during implementation without presenting new architecture or future features as decisions already made.
