# Backup, DR e Contingência

Metas:
- RPO: 15–60 min
- RTO: 1–4 horas

Plano:
- backups automáticos do Postgres
- export de migrations e configs
- restore testado mensalmente

Cenários:
- falha de pagamento (coins)
- corrupção de dados
- DDoS (WAF/rate limit)
- modo manutenção
