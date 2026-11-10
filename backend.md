# Backend: not needed, deliberately

The brief asks for localStorage and no unnecessary backend, so `replica-backend` produced a decision, not a service.

| backend concern | decision |
| --- | --- |
| auth | none. There are no accounts. |
| database | `localStorage` blob, schema and validation in `src/lib/storage.js` |
| payments | none. The app is free. |
| email / jobs | none |
| third-party APIs | none (no Todoist, no webhooks) |
| moving data between devices | JSON backup export and import in Settings |
| security | no network calls apart from fonts. Imports are validated and size-limited (5 MB). CSV export neutralises formula injection. All user text is rendered by React (escaped). |

## If you add a backend later

The storage module is the seam. Replace `load` and `save` with API calls and keep `validate` as the trust boundary.
Suggested path: Supabase or Firebase auth, tables `tasks`, `history_entries` (unique on `id`, which already makes
logging idempotent), `settings` (one row per user), row-level security on `user_id`, and a one-time "merge local data on
first sign-in" step using the existing `parseImport` path.
