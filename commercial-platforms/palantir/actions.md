# Palantir Actions System: Deep Study

**STATUS: RESEARCHED -- Based on official Palantir documentation and verified public sources (August 2026)**

---

## 1. What Actions Are

In the Palantir Ontology, an **action type** is the definition of "a set of changes or edits to objects, property values, and links that a user can take at once." Actions are the kinetic primitive of the Ontology -- while objects, properties, and links represent what exists, actions represent what can happen.

Actions enable users and AI agents to modify Ontology data while thinking about **business objectives** (e.g., "Approve this purchase order") rather than individual property edits (e.g., "Set status to 'approved', set approved_by to 'user_123', set approved_at to '2026-08-13'").

### The Three Ontology Primitives
Palantir describes the Ontology as having three primitives:
1. **Object types** -- Define the things you operate on
2. **Link types** -- Define how those things relate
3. **Action types** -- Define the governed operations that change them

Actions are first-class citizens, not afterthoughts bolted onto a data model.

## 2. Components of an Action Type

### 2.1 Parameters

Parameters are user-defined typed inputs that standardize how data modifications occur:

- Each parameter has a type (string, integer, boolean, date, object reference, etc.)
- Parameters support dropdown configurations for constrained input
- Parameters can have default values
- Parameters can reference existing Ontology objects (e.g., "Select a Customer")
- Parameter values are validated before action submission

### 2.2 Rules

Rules define the logic that transforms parameters into Ontology edits or triggers other effects. There are two main categories:

**Rules that edit the Ontology:**
- Create new objects
- Delete existing objects
- Modify property values on existing objects
- Create links between objects
- Remove links between objects
- Batch modifications across multiple objects in a single transaction

**Rules that trigger other effects:**
- Notifications to relevant parties
- Webhook calls to external systems
- Scheduled builds of downstream datasets
- Other side-effect operations

All rules within a single action execute atomically: either all changes succeed, or all changes fail. There is no partial application.

### 2.3 Submission Criteria

Submission criteria (formerly called "validations") are conditions that determine whether an action can be submitted. They encode business logic into data editing permissions:

- Conditions are based on context: the user, the parameters, the current object state
- Conditions can incorporate object information, relation information, and user attributes
- If submission criteria fail, the action cannot be submitted and side effects will not trigger
- Submission criteria ensure Ontology data quality and editing governance

**Example:**
```
Submission criteria for "Approve Purchase Order":
- Current user must have role "PurchaseApprover"
- Order total must be <= user's approval limit
- Order status must be "PendingApproval"
- Vendor must have active contract (link exists to active Contract object)
```

### 2.4 Side Effects

Side effects are operations that execute after the primary rules have been evaluated. They include:

| Side Effect Type | Description |
|-----------------|-------------|
| **Notifications** | Alert relevant parties when an action completes |
| **Webhooks** | Trigger external system integrations |
| **Scheduled builds** | Trigger downstream dataset rebuilds |
| **Automations** | Trigger further automated workflows |

**Important sequencing rule:** If submission criteria fail, no side effects are triggered. Side effects execute only after primary rules have been evaluated and applied.

## 3. How Actions Modify Ontology Objects

### Modification Types

1. **Property value changes** -- Set, update, or clear properties on individual objects
2. **Object creation** -- Create new Ontology objects with initial property values
3. **Object deletion** -- Remove objects from the Ontology
4. **Link creation** -- Establish relationships between objects
5. **Link removal** -- Remove relationships between objects
6. **Batch transactions** -- Apply all of the above across multiple objects simultaneously
7. **Inline edits** -- Direct property modifications through application interfaces
8. **Media/attachment uploads** -- Associate files with objects

### Transactionality
All modifications within a single action application are transactional:
- If any modification fails, the entire action is rolled back
- This includes both Ontology edits and writeback webhooks (when configured as writeback rather than side effect)
- The Ontology never ends up in an inconsistent state from a partially applied action

## 4. Validation Architecture

### Pre-Submission Validation
Submission criteria run before the action can be submitted. These are the primary business logic validation layer:

- User role and attribute checks
- Parameter value constraints
- Current object state checks
- Related object existence and state checks
- Custom logic via functions

### Rule-Level Validation
Rules themselves can contain conditional logic that determines which edits apply based on parameter values and object state.

### Function-Based Validation
Foundry Functions (TypeScript or Python) can be used as validation rules, enabling:
- Complex business logic that exceeds declarative submission criteria
- Cross-object validation (checking consistency across related objects)
- External system lookups as part of validation

## 5. Authorization

### Permissions Model

Action types have their own permission model:
- **Read permissions** -- Who can see that an action type exists
- **Write permissions** -- Who can edit the action type definition
- **Execute permissions** -- Who can apply (invoke) the action

Execute permissions are independent of object-level permissions. A user might be able to view an object but not execute certain actions on it, or might be able to execute an action that creates objects they can view.

### Object Security Policy Interaction
When an action modifies objects:
- The executing user must have appropriate permissions on the affected objects
- Object security policies (row-level, property-level) are enforced
- Marking-based mandatory access controls apply
- If the user cannot see an object due to security policies, they cannot modify it via an action

### Agent Authorization
When AI agents invoke actions:
- The same permission model applies -- agents operate under a user token
- Action submission criteria are enforced identically
- Audit logs attribute the action to the agent's identity
- No separate "agent bypass" path exists

## 6. Webhooks

### Two Webhook Modes

**Writeback Mode:**
- Webhook executes **before** any other rules are evaluated
- If the webhook call fails, **no changes** are applied to the Foundry Ontology
- Only a single webhook can be configured as a writeback per action type
- Guarantees transactional consistency between Foundry and the external system
- Use case: Write to an external ERP/CRM before updating the Ontology

**Side Effect Mode:**
- Webhook executes **after** other rules are evaluated
- Ontology modifications occur before the webhook fires
- If the webhook fails, Ontology changes are already committed
- Multiple webhooks can be configured as side effects
- Use case: Notify an external system after the Ontology is updated

### Webhook Configuration
- HTTP method, URL, headers, body template
- Authentication credentials (securely stored)
- Retry policies for failed calls
- Timeout configuration

### Integration Pattern
```
Action Applied
    |
    v
[Writeback Webhook] --> External System
    |                        |
    | (if success)           | (if failure: roll back everything)
    v
[Ontology Edits Applied]
    |
    v
[Side Effect Webhooks] --> Notification Services, External APIs
```

## 7. Side Effects Beyond Webhooks

### Notifications
- Alert specific users or groups when an action completes
- Configurable notification content based on action parameters and results
- Delivered through Foundry's notification system

### Scheduled Builds
- Trigger downstream dataset rebuilds after an action changes Ontology data
- Ensures derived datasets reflect the latest state
- Part of the data pipeline orchestration

### Automation Triggers
- Actions can trigger further automated workflows
- Enables cascade patterns: one action triggers another based on the resulting state
- Must be carefully designed to avoid infinite loops

## 8. Action Monitoring and Audit

### Edit History
The Edit History widget provides an **immutable audit trail** of all changes made to Ontology objects:
- Changelog records cannot be deleted or modified by end users
- Ensures a permanent and accurate history of all changes
- Designed for compliance and traceability requirements

### Action Metrics
- Usage tracking: how often each action type is applied
- Success/failure rates
- Performance metrics (execution duration)

### Test Runs
Action types support test runs:
- Validate the action definition before deploying to production
- Test with specific parameter values to verify rules and submission criteria
- Preview what changes would be applied without actually applying them

### Undo/Revert
Actions support undo/revert capabilities:
- Reverse the changes made by a specific action application
- Maintain a full audit trail of both the original action and the reversal

## 9. Branching Action Types

Palantir supports branching action types:
- Action types can be versioned and branched for iterative development
- Changes to action definitions can be tested in isolation before merging into the production Ontology
- This is part of the broader version control model for Ontology types

## 10. Actions in the Agent Context

When AI agents use actions as tools:

1. The action type is exposed as an **Action Tool** in AIP Chatbot Studio
2. The agent sees the action's description, parameters, and their types
3. The agent decides (via reasoning) when to invoke the action
4. The agent provides parameter values based on conversation context
5. Submission criteria are evaluated -- if they fail, the agent receives an error
6. If configured for user confirmation, the agent pauses and asks the human to approve
7. Rules are applied atomically
8. Side effects trigger
9. The agent receives confirmation and can continue reasoning

This pattern ensures that AI agents cannot bypass any of the governance, validation, or security mechanisms that apply to human users.

---

**Sources:**
- [Action Types Overview](https://www.palantir.com/docs/foundry/action-types/overview)
- [Action Types Permissions](https://www.palantir.com/docs/foundry/action-types/permissions)
- [Action Types Rules](https://www.palantir.com/docs/foundry/action-types/rules)
- [Action Types Submission Criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria)
- [Action Types Side Effects / Webhooks](https://www.palantir.com/docs/foundry/action-types/webhooks)
- [Action Types Parameters](https://www.palantir.com/docs/foundry/action-types/parameter-overview)
- [Action Types Branching](https://www.palantir.com/docs/foundry/action-types/branching-action-types)
- [Action Types Inline Edits](https://www.palantir.com/docs/foundry/action-types/inline-edits)
