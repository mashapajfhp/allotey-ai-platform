# AWS AI Platform Overview

**STATUS: RESEARCHED -- Based on official AWS documentation and announcements through mid-2026**

## Platform Identity

AWS's AI platform is built on two foundational services with a newer agentic layer:

1. **Amazon Bedrock** -- fully managed service for foundation models (model access, inference, fine-tuning, guardrails)
2. **Amazon SageMaker** -- ML platform for training, fine-tuning, and deploying custom models
3. **Amazon Bedrock AgentCore** -- the agentic platform for building, deploying, and operating AI agents at scale (GA October 2025, with components continuing to GA through 2026)

## Strategic Direction

AWS's current architecture direction centers on **AgentCore as the agentic runtime layer** on top of Bedrock's model access. The thesis: separate model access (Bedrock) from agent infrastructure (AgentCore), and provide managed infrastructure for both so developers focus on agent logic, not operations.

Key strategic bets:
- **Framework-agnostic agent runtime** -- AgentCore runs agents built with any framework (LangChain, CrewAI, custom), not just AWS-native SDKs
- **Managed infrastructure** -- Firecracker microVMs, managed memory, managed tool gateway
- **Cedar-based policy** -- deterministic, auditable authorization for agent actions
- **Model diversity** -- Bedrock hosts Claude (Anthropic), Llama (Meta), Mistral, Cohere, AI21, Stability, and Amazon's own Titan/Nova models

## Core Platform Components

### Amazon Bedrock (Model Layer)
- **Model catalog**: Claude, Llama 4, Mistral, Cohere, AI21, Titan, Nova, Stability models
- **Inference**: On-demand, provisioned throughput, and batch inference
- **Fine-tuning**: Supervised fine-tuning and continued pre-training for select models
- **Guardrails**: Configurable content filters, topic denial, PII detection, hallucination detection
- **Prompt Management**: Prompt versioning and optimization
- **Flows**: Visual workflow builder for chaining model calls and data processing

### Amazon Bedrock AgentCore (Agent Layer)
12 components forming the agentic platform:

| Component | Purpose |
|-----------|---------|
| **Runtime** | Sandboxed Firecracker microVM execution for agent code |
| **Harness** | Managed, config-driven agent loop (GA June 2026) |
| **Memory** | Short-term and long-term memory management |
| **Gateway** | API/Lambda/MCP routing, authentication, protocol translation |
| **Identity** | Inbound/outbound JWT authentication |
| **Policy** | Cedar-based authorization for tool access |
| **Code Interpreter** | Sandboxed code execution for agents |
| **Browser** | Web browsing capability for agents |
| **Observability** | Metrics, logging, tracing for all AgentCore resources |
| **Payments** | NEEDS VERIFICATION -- payment processing for agent actions |
| **Evaluations** | Agent behavior evaluation |
| **Registry** | Agent and tool registration |

### Amazon Bedrock Knowledge Bases (RAG Layer)
- Document ingestion from S3, Confluence, SharePoint, Salesforce, web sources
- Smart Parsing for multi-format document understanding
- Multiple chunking strategies (fixed-size, semantic, hierarchical, custom)
- Embedding generation with configurable models
- Vector storage options including S3 Vectors (90% lower cost), OpenSearch, Aurora
- Agentic Retriever for complex multi-step queries

### Amazon SageMaker (ML Training Layer)
- Custom model training and fine-tuning
- Notebook-based development environment
- Model hosting and inference endpoints
- MLOps pipelines (SageMaker Pipelines)
- SageMaker JumpStart for pre-trained model deployment

## Platform Architecture

```
Developer / Application
    |
    v
Amazon Bedrock AgentCore
    |
    +---> Runtime (Firecracker microVM)
    |       |
    |       +---> Harness (managed agent loop)
    |               |
    |               +---> Gateway (tools, APIs, MCP)
    |               +---> Memory (short-term, long-term)
    |               +---> Knowledge Bases (RAG)
    |               +---> Code Interpreter
    |               +---> Browser
    |
    +---> Identity (JWT validation)
    +---> Policy (Cedar authorization)
    +---> Observability (metrics, traces, logs)
    |
    v
Amazon Bedrock (Model Inference)
    +---> Model Catalog (Claude, Llama, Mistral, Titan, Nova...)
    +---> Guardrails (content safety, PII, topic filters)
    +---> Fine-Tuning
```

## Competitive Position

- **Strength**: Framework-agnostic runtime -- bring your own agent framework
- **Strength**: Managed infrastructure (Firecracker microVMs eliminate container security concerns)
- **Strength**: Cedar-based policy is the most rigorous agent authorization model in any cloud
- **Strength**: S3 Vectors at 90% cost reduction democratizes vector storage
- **Strength**: Deep AWS ecosystem integration (Lambda, S3, IAM, CloudWatch, VPC)
- **Risk**: AgentCore is newer than Azure AI and less battle-tested
- **Risk**: Framework-agnostic approach means less opinionated guidance for developers
- **Risk**: The relationship between "Bedrock Agents" (older) and "AgentCore" (newer) creates migration confusion

## Key Differentiators for Our Analysis

1. **Framework-agnostic runtime** -- agents built with any framework can run on AgentCore
2. **Cedar policy for agent authorization** -- deterministic, deny-by-default, immune to prompt injection
3. **Firecracker isolation** -- same technology as Lambda, provides strong security boundaries
4. **Harness as config-driven agent loop** -- declarative agent definition without custom orchestration code
5. **S3 Vectors** -- cost-effective vector storage integrated into the existing S3 ecosystem

## Pricing Model

- Bedrock model inference: pay-per-token (varies by model)
- Provisioned throughput: reserved capacity for predictable pricing
- Guardrails: $0.15 per 1,000 text units per filter type (no charge for blocked requests)
- Flows: $0.035 per 1,000 node transitions
- AgentCore: data transfer at standard EC2 rates; component-specific pricing for Runtime, Gateway, etc.
- S3 Vectors: standard S3 pricing with vector-specific operations

## NEEDS VERIFICATION
- AgentCore Payments component -- exact capabilities and availability
- Whether Bedrock Agents (the older service) is being deprecated in favor of AgentCore Harness
- Full pricing breakdown for each AgentCore component
- SageMaker's exact role going forward -- is it being positioned as "training only" while AgentCore handles inference and agents?
