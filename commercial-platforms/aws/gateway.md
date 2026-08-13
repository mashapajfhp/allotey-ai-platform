# AWS AI Gateway Capabilities

**STATUS: RESEARCHED -- Based on official AWS documentation and announcements through mid-2026**

## Overview

AWS does not have a single standalone product called "AI Gateway." Instead, gateway capabilities are distributed across two layers:

1. **Amazon Bedrock** -- provides the model access layer with guardrails, routing, and cost management for model inference
2. **Amazon Bedrock AgentCore Gateway** -- provides the tool access layer that routes agent tool calls to APIs, Lambda functions, and MCP servers

This document covers both, as together they constitute AWS's AI gateway capabilities.

## Model Access Layer (Amazon Bedrock)

### Model Catalog
Bedrock provides unified access to foundation models from multiple providers:

| Provider | Models |
|----------|--------|
| Anthropic | Claude family (Haiku, Sonnet, Opus) |
| Meta | Llama 3, Llama 4 series |
| Mistral | Mistral Large, Ministral |
| Cohere | Command R, Command R+ |
| AI21 Labs | Jamba models |
| Stability AI | Stable Diffusion, SDXL |
| Amazon | Titan (text, embeddings, image), Nova |

### Inference Modes
Three consumption patterns for model access:

| Mode | Use Case | Pricing |
|------|----------|---------|
| **On-demand** | Variable workloads; no commitment | Pay-per-token |
| **Provisioned throughput** | Predictable workloads; guaranteed capacity | Reserved capacity pricing |
| **Batch inference** | Bulk processing; latency-tolerant | Discounted per-token |

### Cross-Region Inference
- Route inference requests across AWS regions for availability and latency optimization
- Automatic failover if a region is unavailable
- NEEDS VERIFICATION: Exact routing logic and customer control over region selection

## Guardrails

Amazon Bedrock Guardrails is the safety and governance layer for model inference:

### Content Filters
- **Hate speech detection** -- configurable thresholds
- **Violence detection** -- content involving physical harm
- **Sexual content detection** -- inappropriate content filtering
- **Insults detection** -- offensive language filtering
- Severity levels: None, Low, Medium, High for each category

### Topic Denial
- Define specific topics that the model should refuse to discuss
- Configurable deny lists with natural language topic definitions
- Use case: prevent agents from providing financial advice, medical diagnoses, etc.

### Sensitive Information Filters
- **PII detection and redaction** -- automatically detect and mask personally identifiable information
- Supported PII types: names, addresses, phone numbers, SSN, credit cards, etc.
- **Regex-based filters** -- custom patterns for domain-specific sensitive data
- Action options: block the response entirely or redact the sensitive content

### Word Filters
- Block specific words or phrases from appearing in responses
- Configurable block lists
- Useful for brand-specific or compliance-specific filtering

### Hallucination Detection (Grounding Checks)
- Evaluate whether model responses are grounded in the provided context
- Configurable grounding threshold
- Helps ensure RAG responses are faithful to retrieved documents

### Policy-Based Enforcement
- IAM policy-based enforcement -- apply specific guardrails to specific model inference calls
- Different guardrail configurations for different use cases within the same account
- Announced March 2025

### Guardrails Pricing
- **$0.15 per 1,000 text units** (1 text unit = 1,000 characters) per filter type
- No charge for requests that are blocked/denied
- Each enabled filter type (content filter, topic filter, etc.) is charged independently

## AgentCore Gateway (Tool Access Layer)

### What It Does
AgentCore Gateway transforms enterprise APIs and services into agent-callable tools:

- **API transformation** -- takes an OpenAPI spec or API definition and generates an agent-compatible tool schema
- **Lambda wrapping** -- wraps AWS Lambda functions as tools with automatic parameter mapping
- **MCP server connection** -- connects to Model Context Protocol servers and exposes their tools to agents
- **Authentication handling** -- manages credentials (API keys, OAuth tokens, IAM roles) for downstream services
- **Protocol translation** -- converts between the agent's tool-call format and the downstream service's API format

### Gateway + Policy Integration
The most important architectural pattern: **Cedar-based Policy sits inside the Gateway** and evaluates every tool call before it reaches the downstream service.

```
Agent makes tool call
    |
    v
AgentCore Gateway receives call
    |
    v
Cedar Policy Engine evaluates:
    - Is this agent permitted to use this tool?
    - Does the user context allow this action?
    - Are there any forbid policies that block it?
    |
    +---> PERMIT --> Gateway routes call to downstream service
    +---> DENY --> Gateway returns denial; tool is never invoked
```

This means:
- Authorization is **outside the agent's code and the model's reasoning**
- Prompt injection cannot bypass authorization (policies are not in the prompt)
- Every tool call is individually authorized
- Default-deny: if no permit policy exists, the tool call is blocked

### Gateway Routing
- Routes tool calls to the correct backend based on the tool definition
- Handles retries and error propagation
- Provides observability for tool call latency and success rates

## Cost Management

### Model Inference Costs
- **Token-based pricing** -- input and output tokens priced separately per model
- **Provisioned throughput** -- committed capacity at a discount for predictable workloads
- **Batch inference** -- significant discounts for latency-tolerant bulk processing
- **Cross-region routing** -- standard data transfer charges apply

### Agent Infrastructure Costs
- **AgentCore Runtime, Gateway, Code Interpreter, Browser** -- data transfer at standard EC2 rates (as of November 1, 2025)
- **Bedrock Flows** -- $0.035 per 1,000 node transitions
- **Knowledge Bases** -- charges for embedding generation, vector storage, and retrieval queries

### Cost Optimization Strategies
1. **Choose the right model size** -- use smaller models (Haiku, Ministral) for simple tasks
2. **Use batch inference** where latency allows
3. **Provision throughput** for predictable, high-volume workloads
4. **S3 Vectors** for knowledge base storage (90% lower cost than OpenSearch Serverless)
5. **Guardrails** -- no charge for blocked requests (only pay when content passes through)

## Architecture Summary

```
Application / Agent
    |
    +---> Amazon Bedrock (Model Access)
    |       +---> Model Catalog (multi-provider)
    |       +---> Guardrails (safety, PII, topics, grounding)
    |       +---> Inference (on-demand, provisioned, batch)
    |
    +---> AgentCore Gateway (Tool Access)
            +---> Cedar Policy Engine (authorization)
            +---> API Routing (OpenAPI, Lambda, MCP)
            +---> Authentication Management
            +---> Observability
```

## Key Design Decisions

1. **Guardrails as a separate, composable layer** -- not baked into individual models but applied as a managed service across any model
2. **Cedar authorization outside the AI** -- deterministic, auditable, not influenced by prompts
3. **Gateway as the single chokepoint** -- all tool access goes through one managed layer with policy enforcement
4. **Multi-model access through one service** -- Bedrock provides a uniform API across model providers
5. **Pay-per-use at every layer** -- no large upfront commitments required

## NEEDS VERIFICATION
- Cross-region inference routing logic and customer control
- Guardrails latency impact on inference requests
- Gateway throughput limits and scaling behavior
- Whether guardrails can be applied to AgentCore tool call outputs (not just model inference)
- Detailed pricing for each AgentCore component beyond data transfer
