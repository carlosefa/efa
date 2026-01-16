# Economia (EFA Coins), Ledger e Reconciliação — Opcional

Feature flags:
- ECONOMY_ENABLED (GLOBAL/COUNTRY/ORG)

Modos:
- payment_mode: OFF | EXTERNAL | COINS
- prize_mode: OFF | EXTERNAL | COINS

Ledger:
- append-only
- idempotência com Stripe webhook
- expiração: 60 dias (FIFO/lotes)

Reconciliação:
- job diário Stripe × Ledger
- alertas de divergência
- regras de chargeback/estorno (documentadas)
