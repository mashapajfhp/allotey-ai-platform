# Microsoft AI Platform Overview

**STATUS: RESEARCHED -- Based on official Microsoft documentation and announcements through Build 2026**

## Platform Identity

Microsoft's AI platform has undergone rapid rebranding:
- **Azure AI Studio** (original launch)
- **Azure AI Foundry** (renamed at Microsoft Ignite, November 2024)
- **Microsoft Foundry** (renamed at Microsoft Ignite, November 2025; effective January 1, 2026)

The current brand is **Microsoft Foundry** -- a unified cloud PaaS for building, optimizing, and managing AI applications and intelligent agents.

## Strategic Vision

Microsoft's enterprise AI strategy rests on three pillars:

1. **Foundry** -- the developer platform for building AI apps and agents (model catalog, fine-tuning, evaluation, deployment, tracing, agent orchestration)
2. **Copilot Platform** -- the end-user AI surface embedded across Microsoft 365, Dynamics 365, and first-party applications
3. **Fabric + Fabric IQ** -- the data and semantic intelligence layer that grounds AI in enterprise data

The unifying thesis: AI agents need models, tools, memory, grounding in enterprise knowledge, identity-aware authorization, and production observability. Foundry provides all of these under one roof.

## Key Platform Components

### Microsoft Foundry (Developer Platform)
- Access to 11,000+ AI models from Microsoft, OpenAI, Anthropic, Meta, Mistral, DeepSeek, xAI, Cohere, NVIDIA, Hugging Face
- Azure is the only cloud with both OpenAI GPT and Anthropic Claude frontier models in one catalog
- Serverless and managed deployment options for models
- Fine-tuning, evaluation, and prompt management
- Agent Service for building and hosting AI agents
- Toolboxes (public preview) -- single managed endpoint for tools, skills, MCP clients, and enterprise data integrations

### Foundry IQ (Knowledge Layer)
- Unified knowledge retrieval layer replacing per-project RAG pipelines
- Connects to SharePoint, OneLake, Azure Blob Storage, Azure SQL, web sources
- Permission-aware retrieval with agentic retrieval capabilities
- GA as of Build 2026

### Fabric IQ (Semantic Intelligence Layer)
- Semantic model layer on Microsoft Fabric
- Ontologies, graph engine, data agents, operations agents
- Natural language to DAX/GQL query translation
- Bridges BI semantic models into AI and operations

### Microsoft Agent Framework
- Open-source SDK (Python and .NET) for building agents and multi-agent workflows
- Merges AutoGen and Semantic Kernel into one platform
- Agent Harness with skills, memory, middleware
- Multi-agent orchestration: sequential, concurrent, handoff, group chat, Magentic-One
- Version 1.0 GA on April 2, 2026

### Identity and Security
- **Entra Agent ID** -- workload identities for AI agents
- **On-Behalf-Of (OBO) delegation** -- agents authenticate using a user's context and inherit that user's permissions
- **Agent 365** -- security infrastructure for agents operating across Microsoft 365

## Platform Architecture Summary

```
User / Copilot
    |
    v
Microsoft Agent Framework (orchestration, multi-agent)
    |
    +---> Foundry Agent Service (hosting, runtime)
    |         |
    |         +---> Foundry IQ (knowledge retrieval, RAG)
    |         +---> Fabric IQ (semantic models, data agents)
    |         +---> Toolboxes (tools, MCP, skills)
    |         +---> Model Catalog (GPT, Claude, Llama, Mistral...)
    |
    +---> Entra Agent ID (identity, OBO delegation)
    +---> Observability (tracing, evaluation, monitoring)
    +---> Guardrails & Governance
```

## Competitive Position

- **Strength**: Deepest enterprise integration (Microsoft 365, Dynamics, Azure AD/Entra, SharePoint, Teams)
- **Strength**: Broadest model catalog with both OpenAI and Anthropic
- **Strength**: Mature identity infrastructure (Entra) repurposed for agent delegation
- **Strength**: Fabric IQ's semantic model approach -- reusing existing BI definitions for AI
- **Risk**: Rapid rebranding creates confusion (three names in two years)
- **Risk**: Platform complexity -- many overlapping services and SKUs

## Key Differentiators for Our Analysis

1. **Identity delegation as infrastructure** -- OBO flow for agents is a first-class pattern, not bolted on
2. **Semantic model reuse** -- existing Power BI semantic models become AI-accessible through Fabric IQ
3. **Toolboxes with MCP support** -- early enterprise-grade MCP adoption
4. **Convergence of AutoGen + Semantic Kernel** -- unified agent framework after years of parallel projects

## Pricing Model

- Foundry IQ billing expected to begin late 2026
- Model usage is pay-per-token (varies by model and deployment type)
- Serverless endpoints vs. managed compute vs. provisioned throughput tiers
- Agent Service pricing tied to Foundry compute

## NEEDS VERIFICATION
- Exact GA dates for Toolboxes (currently public preview as of Build 2026)
- Foundry IQ billing specifics when they are announced
- Whether Agent Framework 1.0 is the recommended path for all new projects or if Semantic Kernel standalone remains supported
