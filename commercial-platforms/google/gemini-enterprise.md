# Gemini Enterprise Capabilities

**STATUS: RESEARCHED -- Based on official Google Cloud documentation and announcements through mid-2026**

## What Is Gemini Enterprise

Gemini Enterprise is Google Cloud's **agentic AI platform for enterprises**, launched in October 2025. It was built on what was previously called Agentspace and consolidates enterprise search, a multimodal assistant, pre-built agents, and an agent builder into a single product.

At Google Cloud Next in April 2026, the platform documentation was labeled **"Gemini Enterprise Agent Platform"** (formerly Vertex AI), signaling that the Vertex AI brand is being folded into the Gemini Enterprise umbrella for enterprise-facing capabilities.

## Gemini Models

### Current Model Family
The Gemini model family is Google's frontier multimodal AI:

| Capability | Details |
|-----------|---------|
| **Modalities** | Text, image, audio, video, code -- all native, not add-ons |
| **Context windows** | Up to 1M+ tokens (some models up to 2M) |
| **Reasoning** | Advanced reasoning and planning capabilities |
| **Code generation** | Strong coding capabilities across multiple languages |
| **Model sizes** | Flash (fast/cheap), Pro (balanced), Ultra (highest capability) |

### Model Garden (Multi-Provider)
Beyond Gemini, the platform provides access to models from other providers through Vertex AI Model Garden:
- Anthropic Claude models
- Meta Llama models
- Mistral models
- And others via LiteLLM integration in ADK

## Grounding Capabilities

Grounding is a core differentiator for Gemini Enterprise -- connecting model responses to verifiable data sources.

### 1. Grounding with Google Search
- Connects Gemini model responses to **real-time Google Search results**
- Model can access up-to-date information beyond its training cutoff
- Search results are cited in the response for verifiability
- Particularly valuable for questions about current events, recent data, or rapidly changing topics
- Available through the Gemini API and Vertex AI

### 2. Grounding with Agent Search (Enterprise Data)
- Configure **data stores** containing enterprise documents and data
- Gemini generates responses grounded in enterprise-specific content
- High-performance RAG (Retrieval-Augmented Generation)
- Supports multiple data source connectors:
  - Google Cloud Storage
  - BigQuery
  - Google Workspace (Drive, Gmail, Calendar)
  - Third-party: Salesforce, ServiceNow, Jira, Confluence, SharePoint
- Designed to eliminate hallucinations by constraining responses to retrieved context

### 3. Grounding with Custom Search API
- Connect Gemini to **external data sources** via custom search APIs
- For organizations with existing search infrastructure
- Bring-your-own-retrieval pattern: Gemini calls your search API and grounds responses on the results
- Useful when data cannot be indexed in Google's systems (compliance, data residency requirements)

### Grounding Architecture
```
User Query
    |
    v
Gemini Model
    |
    +---> [Option 1] Google Search Grounding
    |       +---> Real-time web search results
    |       +---> Citations from search results
    |
    +---> [Option 2] Agent Search Grounding
    |       +---> Enterprise data stores
    |       +---> RAG retrieval over internal documents
    |       +---> Citations from enterprise data
    |
    +---> [Option 3] Custom Search API Grounding
    |       +---> Your search infrastructure
    |       +---> Results from custom API
    |
    v
Grounded Response with Citations
```

## Enterprise Features

### Pre-Built Agents
Gemini Enterprise ships with several ready-to-use agents:

| Agent | Purpose |
|-------|---------|
| **Deep Research** | Conduct multi-step research across enterprise data and web |
| **NotebookLM** | Interactive notebook for document understanding and analysis |
| **Idea Generation** | Brainstorming and ideation across topics |
| **Data Insights** | Business data analysis and visualization |

These agents are production-ready and demonstrate the patterns that custom agents should follow.

### No-Code Agent Builder
- Visual agent creation interface
- Configure agent behavior, tools, and grounding without code
- Suitable for business users and citizen developers
- Agents can be deployed directly from the builder

### Connector Ecosystem
Enterprise data access through managed connectors:

| System | Connector |
|--------|-----------|
| Google Workspace | Drive, Gmail, Calendar, Chat |
| Microsoft 365 | SharePoint, OneDrive, Outlook |
| Salesforce | CRM data, Knowledge Articles |
| ServiceNow | ITSM, CMDB |
| Jira | Issues, Projects |
| Confluence | Spaces, Pages |

### Enterprise Search
- Unified search across connected enterprise data sources
- Semantic search with Gemini-powered understanding
- Faceted search and filtering
- Access-control aware (respects source-level permissions)

## Security and Governance

- **VPC Service Controls** -- restrict data access to authorized VPCs
- **Customer-managed encryption keys (CMEK)** -- control encryption of data at rest
- **Data residency** -- regional deployment with data sovereignty controls
- **Access control** -- IAM-based access control for all resources
- **Audit logging** -- Cloud Audit Logs for all operations

## Pricing

| Component | Pricing Model |
|-----------|--------------|
| Gemini model inference | Per-token (input/output priced separately) |
| Vertex AI Search (grounding) | Per-query |
| Stored session events/memories | $0.25 per 1,000 events/memories (from Jan 28, 2026) |
| Gemini Enterprise subscription | NEEDS VERIFICATION on exact tiers |

## Integration with ADK

Gemini Enterprise capabilities can be accessed from ADK-built agents:
- ADK agents can use Vertex AI models (including Gemini) for reasoning
- ADK agents can leverage Agent Search for grounding
- ADK agents can be deployed to the Gemini Enterprise Agent Engine
- ADK supports Google Search grounding as a built-in tool

## Key Design Decisions

1. **Grounding as a first-class capability** -- not bolted on but integrated into the model serving layer
2. **Multiple grounding modes** -- Google Search, enterprise data, and custom APIs cover different needs
3. **Pre-built agents as reference implementations** -- show what production agents look like
4. **Connector-based enterprise integration** -- managed connectors reduce integration effort
5. **Multimodal by default** -- text, image, audio, video handled natively

## NEEDS VERIFICATION
- Gemini Enterprise subscription pricing tiers and what is included
- Whether Agent Search / enterprise data grounding requires separate provisioning from the Gemini Enterprise subscription
- Performance characteristics of Google Search grounding (latency, freshness)
- Full list of available connectors beyond those documented above
- How permissions from connected systems (SharePoint ACLs, Salesforce profiles) are enforced during search
