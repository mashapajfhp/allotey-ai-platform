# Microsoft Foundry

**STATUS: RESEARCHED -- Based on official Microsoft documentation and Build 2026 announcements**

## What Is Microsoft Foundry

Microsoft Foundry (formerly Azure AI Foundry, formerly Azure AI Studio) is Microsoft's unified cloud platform for enterprise AI development. It provides a PaaS environment for building, optimizing, and managing AI applications and intelligent agents. As of January 1, 2026, it is the canonical name for Microsoft's AI developer platform.

Foundry brings together: runtime, tools, memory, grounding, models, observability, and governance -- everything developers need for production agents, not just model endpoints.

## Model Catalog

The Foundry model catalog provides access to **11,000+ models** from multiple providers:

| Provider | Notable Models |
|----------|---------------|
| OpenAI | GPT-5.4 family, o-series reasoning models |
| Anthropic | Claude Haiku 4.5, Sonnet 4.5, Opus 4.1 |
| Meta | Llama 3.3, Llama 4 series |
| Mistral | Ministral 3B, Mistral Large |
| DeepSeek | DeepSeek V4 |
| xAI | Grok 4.3 |
| Cohere | Command R+ |
| NVIDIA | NIM models |
| Hugging Face | Community models |

Azure is currently the only cloud platform offering both OpenAI GPT and Anthropic Claude frontier models in a single catalog.

## Deployment Options

Three deployment modes exist:

1. **Serverless (pay-per-token)** -- no infrastructure to manage, billed per input/output token
2. **Managed Compute** -- dedicated VM-backed endpoints with autoscaling, for predictable workloads
3. **Global/Standard deployments** -- for OpenAI models, with rate limiting and regional routing

Each model in the catalog specifies which deployment modes it supports. Some models are serverless-only; others support managed compute.

## Fine-Tuning

Foundry supports serverless fine-tuning for select models:

- **OpenAI models**: GPT-5.4 family fine-tuning via Foundry portal or SDK
- **GPT-5 Reinforcement Fine-Tuning (RFT)**: graduated to gated GA with enterprise SLA coverage
- **Partner models**: Ministral 3B, Qwen3 32B, OSS-20B, Llama 3.3 70B available for serverless fine-tuning
- Fine-tuned models deploy to serverless endpoints

The workflow: upload training data --> configure fine-tuning job --> monitor training --> deploy fine-tuned model to endpoint.

## Evaluation

Foundry provides built-in evaluation capabilities at multiple levels:

### Model Evaluation
- Built-in quality evaluators: relevance, groundedness, coherence, fluency
- Built-in safety evaluators: toxicity, bias, policy adherence
- Custom evaluator support
- Side-by-side model comparison

### Trace-Based Evaluation (New at Build 2026)
- Grade real production traces from Foundry, GCP, AWS, or any framework
- No hand-curated datasets required -- evaluates actual agent behavior in production
- Applies quality and safety evaluators to recorded traces

### Agent Evaluation
- Evaluate agent behavior end-to-end, including tool use, knowledge retrieval, and reasoning
- NEEDS VERIFICATION: Exact capabilities and GA status of agent-specific evaluation

## Tracing and Observability

Foundry provides production observability for both models and agents:

- **Token usage and throughput monitoring** -- track consumption across models and endpoints
- **Log and trace inspection** -- inspect individual requests, agent reasoning chains, tool calls
- **Azure Monitor integration** -- standard Azure monitoring, alerting, and diagnostics
- **Cross-platform trace ingestion** -- Foundry can ingest traces from external frameworks for evaluation

The tracing infrastructure captures:
- Model invocations (input/output, latency, token counts)
- Agent reasoning steps
- Tool call chains
- Knowledge retrieval operations
- Error and exception paths

## Foundry Agent Service

The Agent Service is the hosting layer for AI agents built on Foundry:

- **Hosted agent runtime** -- agents run as managed services
- **Toolboxes** (public preview) -- single managed endpoint aggregating tools, skills, MCP clients, and enterprise data integrations
- **Foundry IQ integration** -- agents connect to knowledge bases for grounded responses
- **Session management** -- stateful agent sessions with memory
- **Scaling** -- managed autoscaling based on demand

## Foundry SDK and Portal

### SDK
- Python and .NET SDKs
- CLI tooling for model deployment and management
- Integration with Microsoft Agent Framework for agent development

### Portal
- Web-based UI for model browsing, deployment, fine-tuning, evaluation
- Prompt playground for interactive model testing
- Agent builder with visual configuration
- Monitoring dashboards

## Governance and Compliance

- **Content safety** -- built-in content filters configurable per deployment
- **Role-based access control (RBAC)** -- Azure RBAC for project and resource access
- **Data residency** -- regional deployment with data sovereignty controls
- **Audit logging** -- all operations logged for compliance
- **Responsible AI** -- built-in safety evaluators and content moderation

## Architecture Relationship

```
Microsoft Foundry
    |
    +-- Model Catalog (11,000+ models)
    |     +-- Serverless deployment
    |     +-- Managed compute deployment
    |     +-- Fine-tuning
    |
    +-- Agent Service
    |     +-- Toolboxes (tools, MCP, skills)
    |     +-- Foundry IQ (knowledge retrieval)
    |     +-- Session management
    |
    +-- Evaluation
    |     +-- Model evaluation
    |     +-- Trace-based evaluation
    |     +-- Agent evaluation
    |
    +-- Observability
    |     +-- Tracing
    |     +-- Monitoring
    |     +-- Azure Monitor integration
    |
    +-- Governance
          +-- Content safety
          +-- RBAC
          +-- Audit logging
```

## NEEDS VERIFICATION
- Exact pricing tiers for Agent Service compute
- Whether Toolboxes will remain as a distinct concept or merge into Agent Service at GA
- Full list of models supporting managed compute vs. serverless-only deployment
- Trace-based evaluation GA timeline
