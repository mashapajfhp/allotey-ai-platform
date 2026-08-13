# Secure Compute Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines the architecture for isolated, sandboxed execution of untrusted code within the platform. Agents executing Python, generated code, SQL, file transformations, data analysis, or user-provided code CANNOT run inside the core platform process.

---

## The Problem

AI agents generate and execute code. This is fundamental to their utility — data analysis, visualization, file processing, tool invocations, and automated operations all involve code execution. But generated code is inherently untrusted:

```
UNSAFE (current default in most AI platforms):
    Agent generates Python code
        → Executes in the same process as the platform
            → Has access to platform secrets, network, filesystem
                → Single malicious or buggy generation = platform compromise

REQUIRED (this architecture):
    Agent generates Python code
        → Sends to isolated sandbox
            → Sandbox has NO access to platform internals
            → Sandbox has constrained resources (CPU, memory, time)
            → Sandbox has restricted network access
            → Results are returned through a controlled interface
                → Platform remains secure regardless of generated code behavior
```

---

## Threat Vectors

This architecture addresses the following threats (see also `architecture/security-threat-model.md`):

### 1. Arbitrary Code Execution
**Threat:** Agent-generated code executes arbitrary system commands, accesses platform secrets, or modifies platform state.
**Mitigation:** Code runs in an isolated compute environment with no access to the host system.

### 2. Resource Exhaustion
**Threat:** Generated code enters infinite loops, allocates unbounded memory, or consumes all available CPU.
**Mitigation:** Strict CPU limits, memory limits, and execution timeouts.

### 3. Network Exfiltration
**Threat:** Generated code sends sensitive data to external servers or accesses internal services.
**Mitigation:** Network isolation — sandboxed code has no network access by default. Allowlisted egress only when explicitly required.

### 4. Filesystem Escape
**Threat:** Generated code reads or writes files outside its designated workspace.
**Mitigation:** Filesystem isolation — sandboxed code has access only to a temporary, purpose-built filesystem.

### 5. Secret Leakage
**Threat:** Generated code accesses environment variables, configuration files, or credential stores.
**Mitigation:** Sandboxed environment contains NO secrets. Credentials needed for authorized operations are provided through the Credential Broker (see `architecture/secrets-architecture.md`), never injected into the sandbox environment.

### 6. Cross-Tenant Data Access
**Threat:** Code executing for Tenant A accesses data belonging to Tenant B.
**Mitigation:** Each sandbox is tenant-scoped. No shared state between tenant sandboxes.

---

## Isolation Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Process isolation | Sandboxed code cannot interact with platform processes | CRITICAL |
| Network isolation | No network access by default; allowlisted egress only | CRITICAL |
| Filesystem isolation | Isolated temporary filesystem; no host filesystem access | CRITICAL |
| CPU limits | Maximum CPU time per execution | HIGH |
| Memory limits | Maximum memory allocation per execution | HIGH |
| Execution timeout | Hard timeout; execution killed after limit | HIGH |
| Secret access restrictions | No environment variables, no credential files | CRITICAL |
| Tenant isolation | Each execution is scoped to a single tenant | CRITICAL |
| Artifact handling | Controlled input/output of files and data | HIGH |
| Ephemeral execution | Sandbox destroyed after execution; no persistent state | HIGH |

---

## Execution Types Requiring Sandboxing

### 1. Python Code Execution
Agent-generated Python for data analysis, visualization, computation. Most common use case.

### 2. Generated SQL Execution
Agent-generated SQL queries. Even read-only queries need sandboxing to prevent SQL injection attacks against the analytical engine.

### 3. File Transformations
Processing uploaded files — CSV parsing, PDF extraction, image manipulation. Uploaded files are untrusted input.

### 4. Data Analysis and Visualization
Generating charts, statistical analysis, data summaries. Involves both code execution and file output.

### 5. User-Provided Code
Code submitted directly by users for custom analysis, scripting, or automation. The least trusted category.

### 6. Tool Execution
Some tools may require code execution as part of their operation. Tool code should also be sandboxed.

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT RUNTIME                                │
│                                                                  │
│  Agent decides to execute code                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────┐                                        │
│  │ Execution Request    │                                        │
│  │ - code/query         │                                        │
│  │ - input data         │                                        │
│  │ - resource limits    │                                        │
│  │ - tenant context     │                                        │
│  │ - timeout            │                                        │
│  └──────────┬───────────┘                                        │
└─────────────┼────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SECURE COMPUTE ORCHESTRATOR                         │
│                                                                  │
│  - Validates execution request                                   │
│  - Selects sandbox type (microVM, container, WASM)               │
│  - Enforces resource limits                                      │
│  - Manages sandbox lifecycle (create → execute → destroy)        │
│  - Handles input/output marshalling                              │
│  - Records execution metadata for observability                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────┐
     │  MicroVM     │ │Container │ │ WASM     │
     │  (Firecracker│ │(gVisor + │ │(WASI    │
     │   or similar)│ │ Docker)  │ │sandbox) │
     │              │ │          │ │          │
     │ Strongest    │ │ Good     │ │ Fastest  │
     │ isolation    │ │ balance  │ │ startup  │
     │ ~125ms boot  │ │ of speed │ │ Limited  │
     │              │ │ & safety │ │ language │
     └──────────────┘ └──────────┘ └──────────┘

Each sandbox:
  - Has NO network access (by default)
  - Has NO access to platform secrets
  - Has a temporary, isolated filesystem
  - Has strict CPU/memory/time limits
  - Is destroyed after execution
  - Returns results through a controlled interface
```

---

## Sandbox Types

### MicroVM (Firecracker, gVisor)
**Isolation level:** Strongest — hardware-level virtualization boundary.
**Startup time:** ~125ms (Firecracker).
**Use cases:** Untrusted user code, security-sensitive operations, multi-language support.
**Trade-off:** Highest isolation but higher resource overhead per execution.

### Container Sandbox (Docker + gVisor/seccomp)
**Isolation level:** Good — OS-level isolation with additional kernel protection (gVisor intercepts syscalls).
**Startup time:** Faster than microVM with pre-warmed containers.
**Use cases:** Agent-generated Python/SQL, tool execution, file processing.
**Trade-off:** Good balance of isolation and performance. Not as strong as microVM.

### WASM/WASI Sandbox
**Isolation level:** Good — language-level sandbox with capability-based security.
**Startup time:** Near-instant.
**Use cases:** Simple computations, deterministic functions, lightweight transformations.
**Trade-off:** Fastest startup but limited language support and library availability.

### Ephemeral Kubernetes Jobs
**Isolation level:** Good — pod-level isolation with network policies and resource quotas.
**Startup time:** Seconds (pod scheduling overhead).
**Use cases:** Long-running compute jobs, training jobs, batch processing.
**Trade-off:** Best for longer-running work; too slow for interactive code execution.

---

## Technology Landscape

> All technologies below require individual deep research.

| Technology | License | Category | Status |
|-----------|---------|----------|--------|
| Firecracker | Apache 2.0 | MicroVM manager (AWS Lambda's backend) | NOT STARTED |
| gVisor | Apache 2.0 | Application kernel / syscall interception | NOT STARTED |
| WASM/WASI | Open standard | Language-agnostic sandbox | NOT STARTED |
| Docker + seccomp | Apache 2.0 | Container isolation with syscall filtering | NOT STARTED |
| E2B | VERIFY LICENSE | Cloud sandboxing service (architecture study) | NOT STARTED |

### Architecture References (Study, Not Adopt)

These are commercial/SaaS offerings worth studying for architectural patterns:

- **E2B:** Cloud-hosted sandboxed environments for AI code execution. Study the architecture and API patterns even if not adopted.
- **Modal:** Serverless GPU/CPU execution with strong isolation. Study the execution model.
- **Code Interpreter architectures:** OpenAI's Code Interpreter, Anthropic's analysis tool — study how they sandbox code execution.

---

## Security Integration

This architecture MUST be reflected in the threat model:

```
RULE: Agents must NEVER execute arbitrary generated code inside
      the core platform process. ALL code execution goes through
      the Secure Compute Orchestrator.

This rule applies to:
  - Agent-generated Python/JavaScript/SQL
  - User-provided code
  - Tool implementations that execute dynamic code
  - Data analysis and visualization
  - File processing and transformation
```

### Integration with Credential Broker

When sandboxed code needs to access external services:
1. Agent requests scoped, short-lived credential from the Credential Broker (see `architecture/secrets-architecture.md`)
2. Credential is provided to the sandbox as a runtime parameter (NOT an environment variable)
3. Credential expires after the sandbox is destroyed
4. Credential is scoped to the minimum permissions needed

---

## Research Questions

1. **V1 sandbox choice:** Firecracker vs. gVisor vs. Docker+seccomp — what provides sufficient isolation for V1 without excessive operational complexity?
2. **Startup latency:** What is the acceptable latency for sandbox creation? Interactive code execution needs sub-second; batch can tolerate seconds.
3. **Pre-warming:** Can sandboxes be pre-warmed (created in advance) to reduce startup latency?
4. **Library availability:** How are Python libraries (numpy, pandas, matplotlib) made available inside sandboxes without allowing arbitrary package installation?
5. **Input/output marshalling:** How are data frames, files, and images passed into and out of sandboxes efficiently?
6. **GPU access:** How do training and inference sandboxes access GPU hardware while maintaining isolation?
7. **Cost:** What is the per-execution cost of each sandbox type?
8. **Kubernetes integration:** How does the Secure Compute Orchestrator integrate with the platform's Kubernetes deployment?

---

## References

- `architecture/reference-architecture.md` — Agent/Workflow Runtime
- `architecture/security-threat-model.md` — threat vectors addressed by this architecture
- `architecture/secrets-architecture.md` — Credential Broker integration
- `architecture/capability-model.md` — capability #5 (Agent Runtime), #17 (Action Engine)
- `open-source/secure-compute/README.md` — individual technology research
