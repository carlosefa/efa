# Matriz de Permissões e RBAC

Papéis:
Master, Global Admin, Country Admin, Country Staff (perms), Org Admin, Team Owner, Coach, Player.

Escopos:
GLOBAL / COUNTRY / ORG / TEAM / TOURNAMENT / MATCH

Permissões (exemplos):
- TOURNAMENT_CREATE, TOURNAMENT_EDIT, TOURNAMENT_PUBLISH
- FIXTURES_EDIT, CALENDAR_EDIT
- RESULT_EDIT (motivo obrigatório)
- DISPUTE_DECIDE, WO_APPLY
- PAYOUT (se coins ON)
- MODERATION_CASES
- STAFF_MANAGE
- FEATURE_FLAGS

Regra:
RLS é a fonte da verdade; ações sensíveis sempre auditadas.
