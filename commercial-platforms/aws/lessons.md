# Lessons from AWS's AI Platform

**STATUS: RESEARCHED -- Analysis based on AWS's platform architecture and patterns**

## Managed Infrastructure Patterns

### What AWS Got Right

AWS's core architectural bet is that **agent infrastructure should be managed, framework-agnostic, and composable**. Several patterns are worth studying:

#### 1. Framework Agnosticism
AgentCore does not force a specific agent framework. You bring LangChain, CrewAI, AutoGen, or custom code, and AgentCore provides the runtime, memory, tools, and security around it.

**Why this matters**: The agent framework landscape is evolving rapidly. Betting on one framework risks obsolescence. By providing infrastructure (runtime, memory, gateway, policy) rather than a framework, AWS insulates customers from framework churn.

**What to learn**: Separate infrastructure concerns (execution, memory, tool access, authorization) from agent logic concerns (reasoning, planning, orchestration). Infrastructure should be framework-agnostic; agent logic is where framework opinions belong.

#### 2. Cedar-Based Authorization
AgentCore's use of Cedar for tool-level authorization is the most rigorous approach in any cloud platform:

- **Default-deny** -- no implicit permissions
- **Per-tool evaluation** -- each tool call is independently authorized
- **Outside the AI** -- policies are evaluated by a deterministic engine, not the LLM
- **Immune to prompt injection** -- attackers cannot bypass authorization by manipulating prompts
- **Auditable** -- every authorization decision can be logged and reviewed

**What to learn**: Agent authorization must be deterministic and outside the AI's reasoning loop. Using a policy language (Cedar, OPA/Rego, or equivalent) for agent authorization is the right architectural pattern. Never rely on prompt instructions for security-critical decisions.

#### 3. Firecracker Isolation
Using Firecracker microVMs for agent execution provides:
- Strong isolation between agents (not just container isolation)
- Protection against agents escaping their sandbox
- Same battle-tested technology that powers Lambda

**What to learn**: Agent code is untrusted code (especially when agents can generate and execute code). Isolation should be as strong as for any untrusted workload.

#### 4. Gateway as Single Chokepoint
All tool access goes through the AgentCore Gateway, which provides:
- Centralized authentication management
- Centralized authorization (Cedar policy evaluation)
- Protocol translation (API, Lambda, MCP)
- Observability for all tool interactions

**What to learn**: Having a single managed layer between agents and tools simplifies security, monitoring, and governance. Without a gateway, each agent-tool connection becomes a separate security boundary to manage.

#### 5. S3 Vectors (Cost Innovation)
S3 Vectors provides vector storage at up to 90% lower cost than alternatives. This is important because vector storage costs have been a significant barrier to large-scale RAG deployments.

**What to learn**: Infrastructure cost innovation (not just model cost) matters for AI platform adoption. Making foundational capabilities affordable unlocks use cases.

### What NOT to Copy

#### 1. Late Consolidation
AWS launched "Bedrock Agents" first, then later launched "AgentCore" as a more comprehensive platform. The transition creates confusion:
- Which one should new projects use?
- Are Bedrock Agents deprecated?
- How do existing Bedrock Agents migrate to AgentCore?

**Lesson**: Launch the right abstraction the first time, or at minimum provide a clear migration path and deprecation timeline.

#### 2. Framework Agnosticism Without Guidance
Being framework-agnostic is a strength, but AWS provides less opinionated guidance than Microsoft or Google on how to build agents. This means:
- Developers must choose their own framework
- Best practices are not as well-documented
- The "getting started" experience is more complex

**Lesson**: Framework-agnostic infrastructure should still come with opinionated reference architectures and recommended patterns.

#### 3. Component Sprawl
12 components in AgentCore is a lot to understand and configure. While each serves a purpose, the cognitive load on developers is significant:
- Runtime, Harness, Memory (3 types), Gateway, Identity, Policy, Code Interpreter, Browser, Observability, Payments, Evaluations, Registry

**Lesson**: Progressive disclosure matters. Start developers with a simple path (Harness + Gateway + Memory) and let them opt into advanced components as needed.

## Patterns Worth Adopting

### 1. Deterministic Policy for Agent Authorization
Cedar-based authorization is the gold standard pattern. Adopt a policy language (Cedar, OPA, or equivalent) for controlling what agents can do. Key principles:
- Default-deny
- Per-action evaluation
- Outside the AI reasoning loop
- Auditable decisions

### 2. Managed Agent Runtime
Providing a managed, isolated runtime for agent execution reduces operational burden and improves security. Whether using Firecracker, gVisor, or container isolation, the runtime should be:
- Isolated per-agent/session
- Configurable (resource limits, timeout, network access)
- Observable (metrics, logs, traces)

### 3. Tool Gateway Pattern
A single managed layer between agents and tools provides:
- Centralized auth (agents don't manage individual tool credentials)
- Centralized policy enforcement
- Protocol normalization (REST, GraphQL, MCP all behind one interface)
- Observability for all tool interactions

### 4. Memory as a Managed Service
Rather than each agent team building their own session/memory system, provide memory as infrastructure:
- Session memory (conversation history)
- Long-term memory (learned facts, preferences)
- Automatic injection into agent context

### 5. Multiple Chunking Strategies for RAG
Knowledge Bases' support for fixed-size, semantic, hierarchical, and custom chunking acknowledges that one chunking strategy does not fit all documents. Provide options and let developers choose based on their content.

### 6. Smart Parsing
Using foundation models to parse complex documents (extracting tables, understanding layouts) reduces the "data preparation" burden that kills many RAG projects before they start.

## Anti-Patterns to Avoid

1. **Relying on prompt instructions for authorization.** Cedar's approach -- deterministic policies outside the AI -- is correct. Never use system prompts as a security boundary
2. **Building per-agent tool integrations.** Centralize tool access through a gateway
3. **One chunking strategy for all documents.** Offer options; document types vary widely
4. **Launching overlapping services.** Bedrock Agents vs. AgentCore confusion should be avoided. Clear boundaries from day one
5. **Requiring developers to understand all components upfront.** Progressive disclosure: simple path first, advanced options later

## Summary: What to Take Forward

| Pattern | Adopt? | Notes |
|---------|--------|-------|
| Framework-agnostic runtime | YES | Infrastructure should not force a framework |
| Cedar/deterministic policy for auth | YES | Gold standard for agent authorization |
| Strong isolation (Firecracker-level) | YES | Agent code is untrusted code |
| Tool gateway as single chokepoint | YES | Centralizes security and observability |
| Memory as managed infrastructure | YES | Reduces per-team effort |
| S3 Vectors / cost-effective vector storage | YES | Cost matters for scale |
| Smart Parsing for document ingestion | YES | Reduces data prep burden |
| Multiple chunking strategies | YES | One size does not fit all |
| Framework agnosticism without guidance | PARTIAL | Be agnostic but provide reference architectures |
| 12-component model from day one | NO | Progressive disclosure is better |
| Overlapping predecessor services | NO | Clean abstractions from the start |
