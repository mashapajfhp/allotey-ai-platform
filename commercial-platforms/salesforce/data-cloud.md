# Salesforce Data Cloud / Data 360

**STATUS: RESEARCHED -- Based on official Salesforce documentation and announcements through mid-2026**

## What Is Data Cloud / Data 360

Salesforce Data Cloud -- **renamed Data 360 in October 2025** -- is Salesforce's **customer data platform (CDP)** designed to unify customer data across all Salesforce clouds and external sources into a single profile. It is the foundational data layer that powers Agentforce's intelligence.

During the transition, admins may still see the "Data Cloud" name in older screens, packages, documentation paths, APIs, or community discussions. The underlying technology is the same.

## Why Data Unification Matters for AI Agents

The core thesis: **AI agents can only be as good as the data they have access to.** If customer data is fragmented across Sales Cloud, Service Cloud, Marketing Cloud, and external systems, agents get an incomplete picture and make poor decisions.

Data 360 solves this by creating **unified customer profiles** that agents query for complete context before reasoning or acting.

Example without Data 360:
- Agent receives a support case
- Agent only sees Service Cloud data (case history)
- Agent doesn't know the customer just renewed a large contract (Sales Cloud data)
- Agent provides generic support instead of high-priority handling

Example with Data 360:
- Agent receives a support case
- Agent queries the unified profile: sees case history, recent large contract renewal, premium support tier, past satisfaction scores
- Agent provides priority handling appropriate to the customer's full context

## Data Harmonization

Data harmonization is the process of making data from different sources work together. It goes deeper than standardization:

### Data Model Objects (DMOs)
- DMOs are **standardized data containers** that harmonize source fields into the Customer 360 model
- Source systems (Sales Cloud, Service Cloud, Marketing Cloud, external CRMs) map their fields to DMOs
- DMOs provide a common vocabulary: "Account" means the same thing regardless of which system it came from
- Standard DMOs exist for: Individual, Account, Contact Point (Email, Phone, Address), Case, Opportunity, Campaign, etc.

### Harmonization Process
```
Source Systems
    |
    +---> Sales Cloud (accounts, opportunities)
    +---> Service Cloud (cases, knowledge)
    +---> Marketing Cloud (campaigns, engagement)
    +---> External CRM (custom fields)
    +---> E-commerce (orders, returns)
    |
    v
Data Mapping (source fields --> DMO fields)
    |
    v
Data Model Objects (standardized containers)
    |
    v
Unified Data Layer
```

### Why Harmonization Matters
- **Consistent semantics** -- "customer email" has one meaning across all sources
- **Query simplicity** -- agents query one model, not multiple source schemas
- **Data quality** -- harmonization surfaces inconsistencies and duplicates
- **Governance** -- one model to govern, not many

## Identity Resolution

Identity resolution is the process of **matching and merging customer records across sources** into unified profiles. It is the backbone of Data 360.

### How It Works

#### 1. Match Rules
Match rules define how records are compared across sources:

| Match Type | Description | Example |
|-----------|-------------|---------|
| **Exact match** | Exact field value comparison | Same email address |
| **Fuzzy match** | Approximate comparison | "Jon Smith" ~ "John Smith" |
| **Normalized match** | Match after normalization | "+1(555)123-4567" = "5551234567" |

Multiple match rules can be combined. For example:
- Rule 1: Exact email match
- Rule 2: Exact phone + fuzzy name match
- Rule 3: Exact account + exact last name + fuzzy first name match

#### 2. Reconciliation Rules
When records match, reconciliation rules determine which values to keep:

| Strategy | Description |
|----------|-------------|
| **Most recent** | Keep the most recently updated value |
| **Source priority** | Prefer values from a designated source system |
| **Most frequent** | Keep the value that appears most often |
| **Manual** | Flag for human review |

#### 3. Unified Profiles
The output of identity resolution is a **unified profile** for each individual/account:
- One profile per customer, regardless of how many source records exist
- All related data (cases, opportunities, interactions) linked to the unified profile
- Profile updates in real time as new data arrives

### Identity Resolution Pipeline
```
Source Profile Records (potentially millions)
    |
    v
Match Rules (exact, fuzzy, normalized)
    |
    v
Match Groups (records believed to be the same entity)
    |
    v
Reconciliation Rules (which values win)
    |
    v
Unified Profiles (one per customer)
    |
    v
Agents query unified profiles for complete context
```

## How Agents Ground on Unified Data

Agentforce agents query Data 360 unified profiles as part of their reasoning loop:

1. **Agent receives request** (e.g., customer asks about their order)
2. **Agent queries Data 360** to retrieve the unified customer profile
3. **Profile provides context**: order history (Commerce), support history (Service), account status (Sales), engagement (Marketing)
4. **Agent reasons with full context** using the Atlas Reasoning Engine
5. **Agent takes action** informed by the complete customer picture

This is **domain grounding** -- the agent is grounded in the semantics of customer relationships, not just flat document retrieval.

## Data Sources

Data 360 supports ingestion from:

| Source Category | Examples |
|----------------|----------|
| **Salesforce Clouds** | Sales, Service, Marketing, Commerce, Experience |
| **Cloud storage** | Amazon S3, Google Cloud Storage, Azure Blob |
| **Databases** | Snowflake, BigQuery, Redshift |
| **Streaming** | Amazon Kinesis, Google Pub/Sub |
| **APIs** | REST APIs via MuleSoft connectors |
| **Files** | CSV, JSON, Parquet uploads |

## Segmentation and Activation

Beyond powering agents, Data 360 supports traditional CDP use cases:

- **Segments** -- define customer segments based on unified profile attributes
- **Calculated insights** -- compute metrics across unified data (lifetime value, engagement score, etc.)
- **Activation** -- push segments to marketing channels, ad platforms, or downstream systems
- **Real-time triggers** -- trigger automations when unified profile data changes

## Architecture Relationship to Agentforce

```
Agentforce Agent
    |
    +---> Atlas Reasoning Engine
    |       |
    |       +---> Query Data 360 for customer context
    |       |       |
    |       |       +---> Unified Profile
    |       |       +---> Related Objects (Cases, Opportunities, Orders)
    |       |       +---> Calculated Insights (LTV, Satisfaction Score)
    |       |
    |       +---> Select and Execute Actions
    |       |
    |       +---> Generate Grounded Response
    |
    +---> Einstein Trust Layer
            +---> Mask PII before LLM processing
            +---> Un-mask in final response
            +---> Log to audit trail
```

## Implementation Sequence

The recommended implementation sequence (from Salesforce documentation):

1. **Plan use cases** -- define what agents need to do and what data they need
2. **Provision Data 360** -- set up the Data Cloud instance
3. **Connect data sources** -- configure connectors for each source system
4. **Map and harmonize** -- map source fields to DMOs
5. **Configure identity resolution** -- set up match and reconciliation rules
6. **Build segments and insights** -- define calculated metrics for agent use
7. **Activate** -- enable agents and automations on unified data
8. **Govern** -- configure access controls, audit, and data quality monitoring

## NEEDS VERIFICATION
- Maximum number of source systems that can be connected simultaneously
- Identity resolution processing latency for large datasets (millions of records)
- Whether Data 360 supports custom DMOs beyond the standard set
- Real-time vs. batch processing capabilities for each data source type
- Data 360 pricing model (included with editions vs. capacity-based add-on)
- Whether non-Salesforce AI tools/agents can query Data 360 directly
