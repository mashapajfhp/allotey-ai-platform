# Google AI Platform Overview

**STATUS: RESEARCHED -- Based on official Google Cloud documentation and announcements through mid-2026**

## Platform Identity

Google's enterprise AI platform has undergone a significant rebranding consolidation:

- **Vertex AI** (original enterprise AI platform) -- renamed/folded into Gemini Enterprise Agent Platform
- **Gemini Enterprise** -- launched October 2025 as the unified enterprise AI surface; described as "formerly Vertex AI" at Google Cloud Next April 2026
- **Agent Development Kit (ADK)** -- open-source framework for building agents, announced at Cloud Next 2025, now at v2.0

The current positioning: **Gemini Enterprise** is the product brand, **Vertex AI** is the underlying infrastructure, and **ADK** is the developer framework.

## Strategic Vision

Google's enterprise AI strategy rests on three pillars:

1. **Gemini models** -- Google's frontier multimodal models, the reasoning core for enterprise AI
2. **Gemini Enterprise (Agent Platform)** -- the managed platform for enterprise search, agents, and Copilot-like experiences
3. **Agent Development Kit (ADK)** -- the open-source developer framework for building multi-agent systems

Additionally, Google originated two important protocols:
- **A2A (Agent-to-Agent)** -- open protocol for inter-agent communication, now governed by the Linux Foundation
- **MCP support** -- ADK supports the Model Context Protocol for tool integration

## Core Platform Components

### Gemini Models
- **Gemini 2.x / 3.x family** -- multimodal models supporting text, image, audio, video, code
- **Available through Vertex AI Model Garden** -- also accessible via Gemini API
- **Long context windows** -- up to 1M+ tokens for processing large documents
- **Grounding capabilities** -- built-in Google Search grounding and enterprise data grounding

### Gemini Enterprise (Agent Platform)
Launched October 2025, bundles:
- **Enterprise search** -- search across enterprise data sources
- **Multimodal assistant** -- conversational AI with multimodal understanding
- **Pre-built agents**: Deep Research, NotebookLM, Idea Generation, Data Insights
- **No-code agent builder** -- visual agent creation without coding
- **Connector ecosystem** -- Google Workspace, Microsoft 365, Salesforce, ServiceNow, Jira

### Agent Development Kit (ADK)
Open-source framework for building agents and multi-agent systems:
- **Multi-language**: Python, Go, Java, TypeScript
- **Workflow agents**: Sequential, Parallel, Loop, Graph-based routing
- **Multi-agent orchestration**: Agent delegation, shared state
- **Tool integration**: Function calling, MCP servers, custom tools
- **A2A support**: Agents can communicate via the A2A protocol
- **Evaluation**: Built-in agent evaluation capabilities

### Vertex AI Infrastructure
The underlying infrastructure layer:
- **Model Garden** -- access to Gemini, Anthropic, Meta, Mistral models via unified API
- **Agent Engine** -- managed runtime for ADK-built agents (NEEDS VERIFICATION on current naming)
- **Vector Search** -- managed vector database for RAG
- **Grounding services** -- Google Search grounding, Agent Search grounding, custom search API grounding
- **Feature Store** -- managed feature serving for ML models

## Platform Architecture

```
Developer / Application
    |
    +---> Gemini Enterprise (managed platform)
    |       +---> Enterprise Search
    |       +---> Pre-built Agents (Deep Research, NotebookLM, etc.)
    |       +---> No-code Agent Builder
    |       +---> Connector Ecosystem
    |
    +---> Agent Development Kit (custom agents)
    |       +---> Workflow Agents (Sequential, Parallel, Loop, Graph)
    |       +---> Multi-Agent Orchestration
    |       +---> Tool Integration (Function Calling, MCP)
    |       +---> A2A Protocol Support
    |
    +---> Vertex AI (infrastructure)
            +---> Gemini Models
            +---> Model Garden (multi-provider)
            +---> Grounding Services
            +---> Vector Search
            +---> Agent Engine (managed runtime)
```

## Competitive Position

- **Strength**: Best-in-class multimodal models (Gemini handles text, image, audio, video natively)
- **Strength**: Originated the A2A protocol -- setting the standard for agent interoperability
- **Strength**: Open-source ADK with multi-language support (Python, Go, Java, TypeScript)
- **Strength**: Google Search grounding provides access to real-time web knowledge
- **Strength**: Pre-built agents (NotebookLM, Deep Research) demonstrate production quality
- **Risk**: "Vertex AI" vs. "Gemini Enterprise" naming creates transition confusion
- **Risk**: Enterprise adoption lags behind Azure and AWS in regulated industries
- **Risk**: ADK is newer and less battle-tested in enterprise deployments than Microsoft's Agent Framework

## Key Differentiators for Our Analysis

1. **A2A protocol** -- Google originated the open standard for agent-to-agent communication, now supported by 150+ organizations
2. **ADK workflow agents** -- first-class support for sequential, parallel, loop, and graph-based agent orchestration patterns
3. **Graph-based workflows in ADK 2.0** -- directed graph composition of agents and deterministic execution nodes
4. **Multimodal by default** -- Gemini models handle all modalities natively, not as add-ons
5. **Google Search grounding** -- unique capability to ground responses in real-time web search results

## Pricing Model

- Gemini model inference: pay-per-token (varies by model and context length)
- Gemini Enterprise: subscription-based (NEEDS VERIFICATION on exact tiers)
- Vertex AI Search: per-query pricing
- Agent Engine: NEEDS VERIFICATION on pricing
- Stored session events and memories: $0.25 per 1,000 events/memories (effective January 28, 2026)

## NEEDS VERIFICATION
- Exact relationship between "Vertex AI" brand and "Gemini Enterprise Agent Platform" brand going forward
- Agent Engine pricing and GA status
- Whether "Vertex AI Agent Builder" is the same as the no-code builder in Gemini Enterprise
- Gemini Enterprise subscription pricing tiers
- LiteLLM integration status for non-Gemini models in ADK
