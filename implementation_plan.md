# Link Members to Publications and Update About Page

## Goal Description

Link `public.integrantes` and `public.publicaciones` tables by adding a foreign key to `integrantes`. Assign specific members to specific publications and update the About page to display members grouped by publication.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.ts](file:///Users/alrs/Documents/el-diario-de-avisos/src/db/schema.ts)

- Add `pubId` column to `members` table referencing `publications.id`.

### Migrations

- Generate a new migration file using Drizzle Kit.
- Append SQL `UPDATE` statements to assigning members to publications:
  - Raquel Campomas (id 1) -> Diario de Avisos (id 1)
  - Yurenia Santana (id 2) -> Diario de Avisos (id 1)
  - Others -> La Opinión Nacional (id 2)

### Backend Actions

#### [MODIFY] [actions.ts](file:///Users/alrs/Documents/el-diario-de-avisos/src/app/actions.ts)

- Update `getIntegrantes` (or create a new function) to join with `publications` and fetch the publication name.

### Frontend

#### [MODIFY] [page.tsx](file:///Users/alrs/Documents/el-diario-de-avisos/src/app/about/page.tsx)

- Fetch members with publication data.
- Group members by publication.
- Render sections for each publication.

## Verification Plan

### Automated Tests

- Run `npm run db:migrate` (or equivalent) to apply changes.
- Verify no build errors: `npm run build`.

### Manual Verification

- Check the About page (`http://localhost:3000/about`) to see if members are grouped correctly.
- Verify in database that `pubId` is correctly populated.
