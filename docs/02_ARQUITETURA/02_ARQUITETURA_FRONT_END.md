# Arquitetura Front-End

Stack:
- Next.js (App Router) + TypeScript
- Tailwind + Design tokens (Cyber Neon)
- next-intl (15 idiomas)
- Supabase Auth (SSR) + RLS como fonte da verdade
- TanStack Query (cache, retry, invalidations)

Padrões:
- App Shell responsivo (sidebar/topbar)
- Guard por role/escopo
- Estados: loading/empty/error sempre
- Componentização: Tables, Filters, Modals, Wizards
