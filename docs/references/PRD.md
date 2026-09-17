# PRD — Allan Dantas Photography Portfolio

## 1. Source of truth and document status

This document consolidates the MVP/v1 product decisions from **Criar portfólio fotográfico**, conversation `6aa44389-2cbc-83e9-b3a6-2aaed8096360`, together with the current documentation request. It does not introduce external research, requirements from other projects, or earlier proposals superseded by later decisions.

Companion documents: [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) and [UI_SPEC.md](UI_SPEC.md).

The project is ready to move from consolidated planning into implementation. These documents do not claim that the application, database policies, or deployment already exist. Unresolved implementation details are explicitly identified. Requirement identifiers below organize this consolidation rather than preserving the conversation's provisional numbering.

Documentation is in English. The product's user-facing language remains Brazilian Portuguese, including its approved brand copy and interface labels.

## 2. Vision and objective

Build an authored photography portfolio that introduces Allan Dantas, presents selected photographic projects as stories, and turns visitor interest into contact. Photography is the primary focus, supported by an authentic, young, calm, and playful identity.

The product combines a public website with a private administration area. Allan must be able to manage projects, photographs, publication, inquiries, and global information without editing code.

The MVP must be simple, organized, functional, and scalable. Scalability means preserving room for later development, not shipping future features in v1.

Brand slogan: **Cada clique, uma história!**

## 3. Actors

| Actor | Access and purpose |
|---|---|
| Visitor | Discover the photographer, browse published projects, and find contact channels. |
| Prospective client | Uses the public website and submits a name, mobile/WhatsApp number, and message without creating an account. |
| Administrator | Initially Allan alone; signs in and manages portfolio content and incoming inquiries. |

The application server is the technical intermediary for controlled data access, not another end-user role. Being authenticated is insufficient for administrative access: the user must also be authorized through `admin_users`.

## 4. MVP scope

### 4.1 Public website

- Home with brand identity, a featured photograph, slogan, and portfolio link.
- Editorial portfolio with project covers, titles, categories, and years when supplied.
- Individual project pages with ordered galleries and a return to the portfolio.
- About page using a real presentation of the photographer.
- Contact page with configured Instagram, WhatsApp, and email channels plus an inquiry form.
- A 404 page with a clear return path.
- Shared header/footer, responsive composition, accessibility, SEO, and optimized images.

### 4.2 Administration

- Private `/admin` entry with login, session, authorization, and logout.
- Dashboard with useful counts, recent inquiries, recent projects, and a new-project action.
- Project creation, editing, drafts, private preview, publication, deactivation, and ordering.
- Multiple photo uploads by dragging files or using the system file picker, automatic processing, ordering, cover selection, and alternative text.
- Inquiry reading, status management, and direct links to each client's WhatsApp conversation.
- Trash for projects and photos, with restoration and confirmed permanent deletion.
- Global settings for identity, contact channels, location, copyright, and watermark text.

## 5. Functional requirements

| ID | Requirement |
|---|---|
| FR01 | Provide Home, Portfolio, Project, About, Contact, and 404 pages. |
| FR02 | Provide public navigation to Portfolio, About, and Contact; the brand links to Home. |
| FR03 | Reuse a consistent header/footer without public Admin or Login links. |
| FR04 | List only published, non-trashed projects in the administrator's saved editorial order. |
| FR05 | Open each project at `/portfolio/[slug]`, displaying its available photos in their saved order. |
| FR06 | Display the project's title, category, cover, and supplied optional year/description without inventing missing information. |
| FR07 | Provide a clear route back from a project to the portfolio. |
| FR08 | Display configured public contact channels and allow visitors to open Instagram, WhatsApp, and email. |
| FR09 | Accept a required name, mobile/WhatsApp number, and free-text message without requiring authentication. |
| FR10 | Validate the form on the client and server, normalize the mobile number, and persist valid inquiries. |
| FR11 | Show submission success or failure; initialize accepted inquiries as `NEW`. |
| FR12 | Authenticate the administrator by email/password, support logout, and protect administrative routes and operations. |
| FR13 | Show published-project, draft, and new-inquiry counts, recent items, and a new-project action on the Dashboard. |
| FR14 | Create/edit projects with title, unique slug, category, optional year, optional description, cover, and order. |
| FR15 | Save a new project as a draft so editing can continue later. |
| FR16 | Allow an authorized administrator to preview a project before publication. |
| FR17 | Publish, unpublish/deactivate, and republish projects without deleting their content. |
| FR18 | Filter administrative projects by all, published, drafts, and inactive. |
| FR19 | Reorder projects and photos by dragging and persist that order. |
| FR20 | Upload multiple photos from the computer using drag-and-drop or a file picker. |
| FR21 | Accept JPEG/WebP with an initial maximum of 25 MB per file and 20 photos per project; recommend approximately 15 photos. |
| FR22 | Show each file's progress and result, allowing retries without discarding successful files. |
| FR23 | Automatically produce web images with corrected orientation, preserved proportions, optimization, sanitized metadata, authorship/copyright, and watermark. |
| FR24 | Select a cover from the project's own photos and edit photo alternative text. |
| FR25 | Move projects/photos to Trash, hide them from normal areas, and support restoration. |
| FR26 | Permanently delete trashed items only after explicit confirmation, removing relevant records and stored files. |
| FR27 | Show an inquiry's name, mobile number, message, received date/time, and status in Admin. |
| FR28 | Distinguish and manage New, Viewed, In contact, and Finished inquiry statuses. |
| FR29 | Build a clickable WhatsApp conversation link from the client's normalized mobile number. |
| FR30 | Edit the single global settings record; do not expose settings creation/deletion or administrator management in the panel. |

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR01 | Work on mobile, tablet, and desktop with adapted composition and no unintended horizontal overflow or distortion. |
| NFR02 | Prioritize the main photograph and defer off-screen images when appropriate. |
| NFR03 | Deliver responsive, optimized images while preserving photographic quality; calibrate with real photos. |
| NFR04 | Support keyboard navigation, visible focus, contextual alternative text, and readable contrast. |
| NFR05 | Keep project names and links available without relying exclusively on hover. |
| NFR06 | Provide page titles, descriptions, meaningful content hierarchy, and readable URLs for SEO; keep Admin out of indexing. |
| NFR07 | Support modern Chrome, Safari, Firefox, and Edge. |
| NFR08 | Separate interface, validation, business rules, and persistence; reuse shared components. |
| NFR09 | Enforce server-side administrative authorization, enable RLS, and keep privileged credentials out of the browser and repository. |
| NFR10 | Keep inquiries and settings private; expose only public values selected by the server. |
| NFR11 | Keep temporary originals private and serve processed versions only; remove sensitive image metadata. |
| NFR12 | Use HTTPS in production and environment variables for technical configuration and secrets. |

No SLA, conversion target, fixed performance budget, or mandatory audit score was established. Such numbers are not assumed to be v1 acceptance criteria.

## 7. Business rules

### 7.1 Projects and publication

1. A project is the work's folder/album. Photos belong directly to it; there are no nested folders or `Folder` entity.
2. States are `DRAFT`, `PUBLISHED`, and `INACTIVE`.
3. Public projects must satisfy `status = PUBLISHED` and `deleted_at IS NULL`. Their displayed photos must also be outside Trash.
4. Publication requires at least one available photo and a valid cover belonging to that project. Trashed projects cannot be published.
5. Deactivation preserves data and photos. Deactivation and deletion are different operations.
6. Ordering is editorial, not necessarily chronological. Category and year do not automatically determine layout.
7. Category is a text field in v1; taxonomy and category administration were deferred.
8. Year and description are optional. Slugs are unique. There is no project layout-selection field in v1.
9. A cover can use a different crop, while gallery images should preferably retain their original composition.

### 7.2 Photographs

1. Approximately 15 photos is an editorial recommendation, not a required count or minimum. The initial maximum is 20 per project.
2. The initial per-file limit is 25 MB. JPEG and WebP are accepted. PNG, RAW/CR2, TIFF, and PSD are excluded from the final v1 photography upload flow.
3. Processing is automatic; Allan does not need to resize each web image manually.
4. Web versions start at approximately 2000 px on the longest side, preserving aspect ratio; final quality is calibrated visually.
5. The **✳· ALLAN DANTAS** watermark is embedded discreetly and proportionally in the web image. It does not alter the original on Allan's computer.
6. Metadata is sanitized, preserving/reapplying authorship, credit, and copyright while removing GPS, serial numbers, and unnecessary or sensitive information.
7. Uploaded originals are private and temporary. Delete them after successful processing and confirmation that the web version and its data have been stored.
8. The portfolio is not a backup, RAW archive, or original-file delivery system.
9. Reduced resolution, watermark, metadata, visible copyright, and drag/context-menu restrictions are deterrents. The product does not promise that images displayed in a browser are impossible to copy.

### 7.3 Trash

1. Normal deletion sets `deleted_at` on projects/photos without physically deleting stored files.
2. Trashing a project hides the project and its photos from the website without physically altering all photo records.
3. Restoration clears the item's `deleted_at`. Visibility still depends on the project status and each photo's own Trash state.
4. Only permanent deletion removes records and files. Permanently deleting a project includes its photos and corresponding stored objects.
5. Permanent deletion requires explicit confirmation. There is no automatic Trash cleanup in v1.
6. Inquiries do not belong in Trash and cannot be deleted through the v1 panel.

### 7.4 Contact and inquiries

1. Name, mobile/WhatsApp number, and message are required. The client does not need an account or an email field.
2. The initial audience is Brazilian. Validate the mobile number, store it in international format with `+55`, display it in a readable format, and use normalized digits in the WhatsApp link.
3. Number validation does not verify that a WhatsApp account exists.
4. Submission goes through a controlled server operation. Visitors cannot read or insert directly into `contact_requests`.
5. Every accepted inquiry starts as `NEW`. Administrative statuses are `VIEWED`, `IN_CONTACT`, and `FINISHED`.
6. The discussed interaction marks a New inquiry as Viewed when opened; the administrator controls In contact and Finished.
7. The public success response confirms receipt and tells the visitor to await contact, without promising an unconfirmed response time.
8. Replies take place through the external contact channel. There is no built-in chat or automatic message sending in v1.

### 7.5 Administration and settings

1. `/admin` is absent from public navigation. A hidden URL is not a security mechanism.
2. Without a valid session, show login. With a valid session and authorization, show Dashboard. Logout ends the session.
3. There is no public signup, social login, or administrator-management screen.
4. Accounts are created in Supabase Auth; membership in `admin_users` grants authorization.
5. `site_settings` contains one private global record. Admin can read/update it; the server selects which values are rendered publicly.
6. Passwords and technical secrets do not belong in `site_settings`.

## 8. Main flows

### F01 — Discovery and contact

Home → Explore portfolio → select project → browse gallery → return to works or open Contact → use an external channel or complete the form → validate → store inquiry → confirm receipt.

### F02 — Publish a project

Login → Dashboard/Projects → New project → enter title, category, slug, and optional information → save draft → upload photos → monitor processing → reorder → choose cover → preview → publish. Missing publication prerequisites produce a clear explanation and block publication.

### F03 — Update the public selection

Projects → edit/reorder → save. To temporarily remove a project from the website, deactivate it. To remove it from normal management areas, move it to Trash. These actions are distinct.

### F04 — Handle an inquiry

Visitor submits form → New inquiry → Admin opens inquiry → Viewed → opens the client's WhatsApp → marks In contact → marks Finished. The inquiry remains in history.

### F05 — Restore or permanently delete

Project/photo → move to Trash → open Trash → restore; alternatively, choose permanent deletion → explicitly confirm → remove relevant records/files. Cancelling confirmation preserves the item.

### F06 — Update global information

Settings → edit allowed fields → validate → save → website uses updated public values. New uploads use the current watermark/copyright settings. Retrospective reprocessing of existing images is not included in v1.

## 9. Acceptance criteria

| ID | Verification |
|---|---|
| AC01 | Public pages are navigable, share a consistent header/footer, and expose no administrative navigation link. |
| AC02 | Published projects appear in saved order; drafts, inactive projects, and trashed items are not delivered as public projects, including direct slug access. |
| AC03 | Publication without an available photo or valid cover is rejected; another project's photo cannot be selected as cover. |
| AC04 | Drafts persist, can be resumed and privately previewed, and deactivation preserves content. |
| AC05 | Both file-selection methods work; accepted JPEG/WebP files within limits proceed, while invalid format, size, or quantity produces understandable feedback. |
| AC06 | Each file shows progress/result; a failed file can be retried without discarding completed photos. |
| AC07 | Processed images retain orientation/proportion, include a discreet watermark and authorship/copyright, and exclude sensitive metadata. Originals are private and removed after success. |
| AC08 | Project/photo order and cover selection remain after reloading. |
| AC09 | Trash hides content; restoration follows publication rules; permanent deletion requires confirmation and removes relevant stored files. |
| AC10 | Invalid forms create no inquiry; valid forms create a New inquiry and return confirmation without internal administrative data. |
| AC11 | Admin can read inquiries, change status, and open the correct normalized WhatsApp destination; visitors cannot read inquiries. |
| AC12 | Missing sessions and unauthorized users cannot execute administrative operations; logout prevents continued administrative access. |
| AC13 | Visitors cannot query settings directly; administrative edits persist and expose only server-selected public values. |
| AC14 | Mobile, tablet, and desktop layouts remain usable, with keyboard access, focus, readable content, and information independent of hover. |
| AC15 | Deployment uses configured Vercel/Supabase environments without repository secrets, fictional contact details, assumed years, or production placeholders. |

## 10. Out of scope and future possibilities

The following are not v1 requirements:

- Client accounts, client delivery areas, original downloads, photo sales, payments, or appointment booking.
- Nested project folders, RAW storage, and portfolio-as-backup behavior.
- Blog, testimonials, advanced filtering, and a required lightbox.
- Category CRUD, a `categories` table, and administrator-selected project layouts.
- A mandatory custom domain; initial deployment uses `.vercel.app`.
- Public signup, social login, multiple permission levels, and administrator management in the panel.
- A custom password-recovery interface, to be evaluated later.
- Notifications, realtime updates, chat, and configurable/automatic initial WhatsApp messages.
- Inquiry deletion, automatic Trash cleanup, or a global empty-Trash operation.
- Rate limiting, CAPTCHA, sophisticated anti-spam, additional login-attempt defenses, auditing, and advanced logs.
- ORM, a separate API/backend, Redux, microservices, or infrastructure added solely for hypothetical growth.

Future possibilities are not implementation commitments. The essential authentication, authorization, validation, RLS, and private-storage requirements remain mandatory.

## 11. Explicit open details

- Supply the professional WhatsApp number, email, biography, portrait, and final photo selection; illustrative conversation content is not production data.
- Confirm project years before showing them; do not hard-code the mockup's illustrative date range.
- Calibrate WebP quality, final dimensions, and watermark appearance using real photos.
- Finalize exact RLS policies and image-processing execution during infrastructure setup, as documented in TECHNICAL_SPEC.
- Detail editing a published project's cover/photos, restoring photos beyond the initial limit, and generic empty/error states. No unapproved solution is implied.

These are implementation details of the agreed base, not authorization to expand the MVP.
