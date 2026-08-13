# Lessons from Microsoft's AI Platform

**STATUS: RESEARCHED -- Analysis based on Microsoft's platform architecture and patterns**

## Identity Delegation Patterns

### What Microsoft Got Right

Microsoft's On-Behalf-Of (OBO) delegation is the most mature identity delegation pattern in any AI platform. Key design decisions worth studying:

1. **User identity flows through the agent to downstream systems** -- the agent never acts with broader permissions than the user
2. **Three-question identity model** -- who deployed the agent, what can it do, on whose behalf is it acting -- provides a clean mental model
3. **Reuse of existing identity infrastructure** -- Entra ID (Azure AD) was not rebuilt for agents; it was extended. This means enterprises with existing Azure AD deployments get agent identity "for free"
4. **Workload identity for agents** -- agents have their own identities (object ID, app ID) but don't hold credentials. The platform manages token acquisition
5. **Separation of agent permissions from user permissions** -- the agent has its own scope (what tools it can call), AND the user's scope (what data it can access). Both must permit an action for it to succeed

### What to Learn

- **Identity delegation should be a platform primitive, not an application concern.** If every agent team builds their own OBO-like flow, the result is inconsistent security and duplicated effort
- **The three-question model is useful even outside Microsoft's ecosystem.** Any agent platform should be able to answer: who owns this agent, what can it do, on whose behalf is it acting right now
- **Reuse existing enterprise identity systems.** Don't build a new identity provider for agents. Extend whatever the organization already uses (Entra, Okta, Auth0, etc.)

### What NOT to Copy

- **Deep coupling to a single identity provider.** Microsoft's implementation assumes Entra ID. A platform-agnostic design should support pluggable identity providers
- **Complexity of the token exchange flow.** OBO token exchanges involve multiple round-trips and careful scope management. For simpler use cases, a lighter delegation pattern may suffice

## Semantic Model Integration (Fabric IQ)

### What Microsoft Got Right

The insight that **existing BI semantic models are already curated enterprise knowledge** is the most transferable idea from Microsoft's platform:

1. **Reuse, don't rebuild.** Organizations have years of investment in Power BI semantic models with defined measures, dimensions, hierarchies, and business rules. Fabric IQ makes these AI-accessible without duplication
2. **Semantic models as a trust boundary.** Agents query through governed measures and dimensions, not raw tables. Row-level security and object-level security carry through
3. **Natural language to DAX/GQL.** The semantic model provides enough metadata for AI to generate structured queries, reducing hallucination risk compared to raw SQL generation

### What to Learn

- **If your enterprise has a BI layer, it has an AI knowledge layer too.** The business logic encoded in BI models -- what metrics mean, how they're calculated, who can see them -- is exactly what AI agents need
- **Ontologies bridge structured and unstructured knowledge.** Fabric IQ's ontology layer (entities, relationships, rules) provides a bridge between semantic models (structured) and document knowledge (unstructured via Foundry IQ)
- **Graph-based reasoning over business entities** enables multi-hop queries that flat retrieval cannot handle

### What NOT to Copy

- **Tight coupling to a specific BI platform.** Fabric IQ only works with Power BI / Analysis Services semantic models. A generalizable approach should support multiple semantic model formats (dbt, Looker, etc.)
- **Conflating semantic intelligence with the data platform.** Fabric IQ is embedded in Microsoft Fabric. A modular design would separate the semantic layer from the storage layer

## Platform Unification vs. Fragmentation

### What Microsoft Got Right

- Converging AutoGen + Semantic Kernel into one Agent Framework eliminates the "which one do I use?" problem
- Foundry as a single brand for the AI developer platform simplifies the entry point
- Toolboxes aggregate tools, MCP, skills, and data integrations behind one endpoint

### What NOT to Copy

- **Three names in two years** (Azure AI Studio -> Azure AI Foundry -> Microsoft Foundry) creates confusion and erodes trust. Naming stability matters
- **Overlapping services with unclear boundaries** -- the relationship between Foundry Agent Service, Agent Framework, Copilot Studio, and Power Virtual Agents is not always clear. Consolidation is ongoing but not complete
- **Platform complexity** -- the sheer number of services, SKUs, and configuration options creates a steep learning curve

## Enterprise Patterns Worth Adopting

### 1. Knowledge Layer as a Shared Service
Foundry IQ's model -- knowledge bases as reusable, shared services that multiple agents consume -- is superior to per-project RAG pipelines. Adopt this pattern: centralize knowledge management, let agents consume it.

### 2. Permission-Aware Retrieval by Default
Foundry IQ enforces source-level permissions at retrieval time. This should be a default in any enterprise knowledge system, not an opt-in feature.

### 3. Trace-Based Evaluation
Evaluating agents on real production traces (not just synthetic test cases) is a practical approach to quality assurance. Foundry's ability to ingest traces from any framework and evaluate them is a good pattern.

### 4. Toolboxes / Tool Aggregation
Rather than agents managing individual tool connections, aggregate tools behind a managed endpoint. This simplifies agent code and centralizes tool governance.

### 5. Multi-Agent Orchestration Patterns
MAF's pattern library (sequential, concurrent, handoff, group chat, Magentic-One) provides a useful taxonomy. Most multi-agent systems will use combinations of these patterns.

## Anti-Patterns to Avoid

1. **Assuming agents need all-powerful service accounts.** OBO proves you can delegate minimally. Default to least privilege
2. **Building RAG pipelines per agent.** Centralize knowledge. Foundry IQ's shared knowledge base model is correct
3. **Ignoring existing semantic models.** If the organization has a BI layer, use it for AI grounding instead of rebuilding
4. **Rapid rebranding.** It confuses developers and erodes ecosystem trust. Pick a name and stick with it
5. **Overcomplicating the agent framework.** MAF's merge of AutoGen + Semantic Kernel was necessary but created short-term confusion. Start with a simple, opinionated framework and extend it

## Summary: What to Take Forward

| Pattern | Adopt? | Notes |
|---------|--------|-------|
| OBO identity delegation | YES | Adapt to your identity provider, but the pattern is sound |
| Three-question identity model | YES | Universal mental model for agent identity |
| Semantic model reuse for AI | YES | If you have BI, you have AI knowledge |
| Shared knowledge bases | YES | Centralize, don't duplicate |
| Permission-aware retrieval | YES | Must be default, not opt-in |
| Trace-based evaluation | YES | Practical production quality assurance |
| Tool aggregation (Toolboxes) | YES | Simplifies agent code |
| MCP support | YES | Standard protocol for tool integration |
| Tight coupling to one identity provider | NO | Support pluggable identity |
| Tight coupling to one BI platform | NO | Support multiple semantic model formats |
| Rapid service rebranding | NO | Naming stability matters |
| Overlapping service boundaries | NO | Clear boundaries reduce confusion |
