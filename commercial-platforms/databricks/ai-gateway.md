# Unity AI Gateway -- Governance and Routing for AI Traffic

STATUS: RESEARCH COMPLETE -- August 2026

## What Unity AI Gateway Is

**Unity AI Gateway** (formerly AI Gateway / MLflow AI Gateway) is Databricks' centralized governance, routing, and cost control layer for all AI model and agent traffic. It sits between AI consumers (applications, agents, notebooks, users) and AI providers (Databricks-hosted models, external models like OpenAI/Anthropic/Google, MCP servers).

Unity AI Gateway reached **General Availability** in April 2026 and was significantly expanded at DAIS 2026 to cover MCP server governance, on-behalf-of-user execution, and end-to-end MLflow tracing.

## Core Capabilities

### 1. Provider Abstraction

AI Gateway provides a **unified API** across multiple model providers:

- **Databricks Foundation Models**: Models hosted by Databricks (DBRX, Llama, Mixtral, etc.)
- **External models**: OpenAI (GPT-4, GPT-4o), Anthropic (Claude), Google (Gemini), Cohere, and others
- **Custom models**: Any model deployed on Databricks Model Serving
- **Fine-tuned models**: Customer fine-tuned models via Mosaic AI Training

Applications call a single Databricks endpoint; AI Gateway routes to the configured provider. This means switching from one model to another requires changing a configuration, not application code.

### 2. Model Aliases and Endpoint Management

- **Model aliases**: Logical names (e.g., "production-chat-model") that resolve to specific model endpoints at runtime
- **Endpoint versioning**: Multiple model versions behind a single endpoint
- **Traffic splitting**: Route percentages of traffic to different model versions (for A/B testing or canary deployments)
- **Endpoint types**: Foundation model endpoints, external model endpoints, custom model endpoints, provisioned throughput endpoints

### 3. Rate Limiting

Rate limits enforce consumption bounds at multiple granularities:

| Scope | Description |
|---|---|
| Endpoint-level | Total requests/tokens per minute across all users |
| User-level | Per-user limits to prevent one user from consuming all capacity |
| Group-level | Limits for user groups (e.g., "dev-team" gets lower limits than "production") |

Limit types:
- **Requests per minute (QPM)**: Caps the number of API calls
- **Tokens per minute (TPM)**: Caps token consumption (input + output tokens)
- Both can be set simultaneously

When limits are exceeded, requests return HTTP 429 with retry-after headers.

### 4. Smart Routing (Beta)

Smart Routing dynamically routes each request to the optimal model based on:

- **Quality requirements**: Simple questions routed to smaller/cheaper models; complex questions to frontier models
- **Cost optimization**: Avoids paying frontier model prices for tasks that do not require them
- **Performance/latency**: Routes to models with lower latency when speed matters
- **Availability**: If a provider is down or rate-limited, routes to a backup
- **Budget constraints**: Respect budget ceilings for specific projects or teams

Fallback behavior:
- If the primary model returns a 429 (rate limit) or 5xx (server error), the request is automatically routed to backup models in sequence
- Backup models are configured as an ordered list on the endpoint

### 5. Guardrails

Guardrails inspect and filter requests and responses in real time:

#### Built-in Guardrail Types
| Guardrail | Purpose |
|---|---|
| PII Detection & Redaction | Detect and mask personally identifiable information |
| Content Safety | Block toxic, harmful, or inappropriate content |
| Prompt Injection Detection | Detect attempts to manipulate the model via injected instructions |
| Data Exfiltration Prevention | Block attempts to extract sensitive data through model outputs |
| Hallucination Guard | Detect responses not grounded in provided context |
| Custom Guardrails | User-defined policies via custom prompts |

#### How Guardrails Work
- Each guardrail is backed by an **editable prompt and a configurable model** (not hard-coded rules)
- Guardrails can run on **requests**, **responses**, or **both**
- The guardrail model evaluates whether content violates the policy
- On violation: reject the request, mask sensitive data, or log a warning
- **LLM-based approach**: Uses a language model as the policy evaluator, enabling contextual reasoning (distinguishing actual violations from benign references)
- All guardrail actions are **logged for audit**
- Guardrail evaluator models can be backed by user-created AI Gateway endpoints (enabling custom model selection and fallback)

### 6. Cost Tracking and Usage Analytics

- **Per-endpoint usage**: Track token consumption, request counts, latency
- **Per-user/group attribution**: Attribute costs to specific users, teams, or projects
- **System tables**: Usage data is written to Unity Catalog system tables for custom analysis
- **Budget alerts**: Set spending thresholds with alerting (NEEDS VERIFICATION on current alerting capabilities)

### 7. Audit Logging

- All requests and responses through AI Gateway are logged
- Logs include: caller identity, endpoint, model, tokens used, latency, guardrail evaluations
- Logs are stored in Unity Catalog system tables
- Queryable via SQL for compliance reporting and forensic analysis

## MCP Server Governance

As of 2026, AI Gateway governs **MCP services** alongside model endpoints:

- MCP servers registered in Unity Catalog are routed through AI Gateway
- Rate limits apply to MCP tool calls (requests per minute)
- On-behalf-of-user authentication is enforced (caller's identity passes through)
- Audit logs capture all MCP tool invocations
- Guardrails can be applied to MCP request/response traffic

This means MCP server access is governed with the same policies as model access -- a single governance layer for all AI traffic.

## Architecture Position

```
[Applications / Agents / Notebooks / Users]
                    |
            [ Unity AI Gateway ]
           /        |          \
  [Databricks    [External     [MCP
   Models]        Models]      Servers]
                    |
           [OpenAI, Anthropic,
            Google, Cohere, ...]
```

AI Gateway is not just a proxy -- it is a **policy enforcement point** that:
1. Authenticates the caller
2. Checks rate limits
3. Evaluates request guardrails
4. Routes to the optimal model/provider
5. Evaluates response guardrails
6. Logs the interaction
7. Attributes cost

## Integration with Unity Catalog

- AI Gateway endpoints are **registered in Unity Catalog** as securable objects
- Access to endpoints follows UC permission model (GRANT/REVOKE)
- Usage data flows into UC system tables
- Lineage tracks which agents/applications consume which endpoints
- Model aliases in AI Gateway reference UC-registered model versions

## Key Design Properties

1. **Single governance layer**: One system governs access to all AI providers, whether Databricks-hosted, external, or MCP
2. **Identity-aware**: End-user identity is preserved and enforced, not abstracted away by service accounts
3. **LLM-based guardrails**: Guardrails use AI to evaluate AI, enabling nuanced policy enforcement rather than rigid keyword matching
4. **Cost attribution**: Every token is attributed to a caller, enabling chargeback and budget management
5. **Provider-agnostic**: Applications are decoupled from specific model providers, enabling model migration without code changes

NEEDS VERIFICATION: The exact GA status of Smart Routing as of August 2026. It was listed as Beta at DAIS 2026. Also, whether budget-based routing (automatic throttling when a team's budget is exhausted) is fully shipped or still in preview.
