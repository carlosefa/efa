# Contratos de API (OpenAPI) e Erros

Padrão de erro:
- { "error": "EFA_ERR_CODE", "detail": "...", "meta": {...} }

Idempotência:
- Idempotency-Key obrigatório em pagamentos/webhooks e jobs críticos.

Exemplo OpenAPI (trecho):
```yaml
openapi: 3.0.3
info: { title: EFA Edge API, version: 1.0.0 }
paths:
  /finalize-match:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [match_id]
              properties: { match_id: { type: string, format: uuid } }
      responses:
        '200': { description: OK }
        '400': { description: EFA_ERR_FINALIZE_FAILED }
```

Catálogo (mínimo):
- EFA_ERR_UNAUTHORIZED
- EFA_ERR_FORBIDDEN
- EFA_ERR_VALIDATION
- EFA_ERR_IDEMPOTENCY_REPLAY
- EFA_ERR_STAGE_NOT_FINISHED
