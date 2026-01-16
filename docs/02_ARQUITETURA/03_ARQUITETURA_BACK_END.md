# Arquitetura Back-End

Stack:
- Supabase Postgres + RLS
- Edge Functions (Deno)
- Storage privado (evidence) + signed URLs
- Task Queue em Postgres

Princípios:
- Event sourcing: match_events → match_state → match_results
- Ledger append-only (coins opcional)
- Feature flags: GLOBAL/COUNTRY/ORG
- Rulesets versionados e travados após início do torneio
