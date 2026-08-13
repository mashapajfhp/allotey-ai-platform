# Salesforce AI Platform Overview

**STATUS: RESEARCHED -- Based on official Salesforce documentation and announcements through mid-2026**

## Platform Identity

Salesforce's AI platform is deeply integrated with its CRM ecosystem. Key brands:

- **Einstein** -- the AI brand across all Salesforce clouds (originally predictive AI, now encompasses generative and agentic AI)
- **Agentforce** -- the autonomous agent platform, unveiled at Dreamforce 2024, now at version "Agentforce 360"
- **Data Cloud (renamed Data 360, October 2025)** -- the unified customer data platform powering AI with customer context
- **Einstein Trust Layer** -- the safety, governance, and compliance layer for all AI interactions

## Strategic Vision

Salesforce's AI strategy is distinct from hyperscalers in one critical way: **AI is always grounded in CRM domain objects**. While Microsoft, AWS, and Google provide general-purpose AI platforms, Salesforce's AI is purpose-built for customer-facing business processes.

The thesis: autonomous AI agents that understand customers (through Data 360) and can take actions on CRM objects (through Agentforce) will transform sales, service, marketing, and commerce without requiring customers to build AI infrastructure.

Key strategic bets:
- **Domain-grounded agents** -- agents that understand accounts, contacts, cases, opportunities, leads natively
- **Data unification first** -- Data 360 unifies customer data so agents have complete context
- **Trust as a differentiator** -- Einstein Trust Layer with zero-retention, masking, toxicity detection, and audit trails
- **Low-code agent creation** -- agents built through configuration, not coding

## Core Platform Components

### Agentforce (Agent Platform)
Autonomous AI agents that operate across the CRM lifecycle:
- **Topics** -- define what the agent knows about (mapped to user intents)
- **Actions** -- define what the agent can do (Apex classes, Flows, API calls)
- **Instructions** -- natural language guidance for agent behavior
- **Atlas Reasoning Engine** -- the AI reasoning core (ReAct-based orchestration)
- Deploys agents for: lead qualification, case routing, opportunity management, customer service

### Data Cloud / Data 360 (Customer Data Platform)
Unified customer data powering agent intelligence:
- **Identity resolution** -- matches and merges customer records across sources
- **Data harmonization** -- maps source fields into the Customer 360 data model
- **Unified profiles** -- single view of each customer across all touchpoints
- **Real-time data** -- streaming ingestion for current customer state

### Einstein Trust Layer (Governance)
Safety and compliance infrastructure:
- **Data masking** -- PII tokenized before sending to LLMs
- **Zero data retention** -- contractual agreements with LLM providers (OpenAI, Azure OpenAI)
- **Toxicity detection** -- scans prompts and responses for inappropriate content
- **Prompt defense** -- guards against prompt injection attacks
- **Audit trail** -- every prompt, response, and feedback logged in Data Cloud

### Einstein AI (Model Layer)
- **Einstein GPT** -- generative AI capabilities across Salesforce clouds
- **Model selection** -- Salesforce uses multiple LLM providers (OpenAI, Azure OpenAI, and internal models)
- **Prompt templates** -- pre-built prompt patterns for common CRM tasks
- **Einstein Copilot** -- conversational AI assistant in Salesforce (predecessor to Agentforce for simpler tasks)

## Platform Architecture

```
Business User / Customer
    |
    v
Agentforce (Autonomous Agents)
    |
    +---> Atlas Reasoning Engine
    |       |
    |       +---> Topics (intent mapping)
    |       +---> Actions (Apex, Flows, APIs)
    |       +---> Instructions (behavioral guidance)
    |
    +---> Data 360 (Customer Data)
    |       |
    |       +---> Unified Customer Profiles
    |       +---> Identity Resolution
    |       +---> Real-time Data Streams
    |
    +---> Einstein Trust Layer
    |       |
    |       +---> Data Masking
    |       +---> Toxicity Detection
    |       +---> Prompt Defense
    |       +---> Audit Trail
    |       +---> Zero Data Retention
    |
    +---> CRM Objects (Accounts, Contacts, Cases, Opportunities, Leads...)
```

## Competitive Position

- **Strength**: Deepest CRM domain grounding -- agents natively understand sales, service, marketing objects
- **Strength**: Data 360 provides unified customer context that no other platform matches for CRM use cases
- **Strength**: Trust Layer is the most comprehensive AI governance layer in any CRM platform
- **Strength**: Low-code agent creation accessible to Salesforce admins, not just developers
- **Strength**: Named a Leader in Gartner's 2026 Magic Quadrant for Conversational AI Platforms
- **Risk**: Locked to Salesforce ecosystem -- agents work best (or only) on Salesforce data and objects
- **Risk**: Still in early enterprise adoption as of Q2 2026
- **Risk**: Pricing is premium and may limit adoption for smaller organizations
- **Risk**: Atlas Reasoning Engine is a black box -- less customizable than open frameworks like ADK or MAF

## Key Differentiators for Our Analysis

1. **Domain grounding on CRM objects** -- agents understand accounts, contacts, cases, opportunities natively, not as generic data
2. **Data unification as an AI prerequisite** -- Data 360 ensures agents have complete customer context before they reason
3. **Trust Layer architecture** -- masking, zero-retention, toxicity detection, and audit trail as a composable governance layer
4. **Topics + Actions + Instructions** -- a simple, declarative model for defining agent behavior without coding
5. **Atlas Reasoning Engine (ReAct)** -- inference-time System 2 reasoning with lower hallucination rates

## Pricing Model

- Agentforce: per-conversation pricing (NEEDS VERIFICATION on exact rates)
- Data 360: included with some Salesforce editions; additional capacity available
- Einstein AI: varies by Salesforce edition and add-on
- Trust Layer: included with Einstein AI features

## NEEDS VERIFICATION
- Exact per-conversation pricing for Agentforce
- Whether Agentforce agents can operate on non-Salesforce data sources (beyond Data 360 connectors)
- Atlas Reasoning Engine customization options beyond Topics/Actions/Instructions
- Whether A2A protocol is supported or planned
- Agentforce 360 specific capabilities vs. base Agentforce
- Current enterprise adoption numbers beyond "early adoption"
