# ML Platform Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Purpose

Defines the architecture for custom/specialist model development within the enterprise AI platform. This is SEPARATE from foundation model consumption (which is handled by the Model Gateway / LiteLLM).

---

## Critical Distinction: Two Modes of Model Usage

```
MODE 1: FOUNDATION MODEL CONSUMPTION (via Model Gateway / LiteLLM)
    ├── API-served models (Claude, GPT-4, Gemini)
    ├── Self-hosted open-weight models (via vLLM)
    ├── Provider abstraction, routing, fallback, cost tracking
    └── Architecture: see reference-architecture.md → Model Gateway

MODE 2: CUSTOM / SPECIALIST MODEL DEVELOPMENT (this document)
    ├── Domain-specific models trained on organizational data
    ├── Fine-tuned foundation models for specialized tasks
    ├── Traditional ML models (classification, forecasting, anomaly detection)
    └── Architecture: Dataset → Train → Evaluate → Register → Serve → Monitor
```

**Why both matter:** The Model Gateway handles "which LLM do I call?" The ML Platform handles "how do I build, train, evaluate, and serve our own models?" These are complementary, not competing, capabilities.

---

## Capability Areas

### 1. Dataset Registry

**What it does:** Catalogs, versions, and governs datasets used for training and evaluation. Tracks dataset lineage, quality metrics, schema, and access controls.

**Why it matters:** Training data is the most consequential input to model quality. Without a registry, teams lose track of what data was used to train what model, making reproducibility and audit impossible.

**Research questions:**
- How does the dataset registry integrate with the Domain Ontology?
- What versioning scheme supports reproducible training runs?
- How are dataset access controls enforced (integration with OpenFGA)?

### 2. Feature Engineering

**What it does:** Transforms raw data into features suitable for model training and inference. Manages feature definitions, computation pipelines, and a feature store for online/offline serving.

**Why it matters:** Features are the bridge between raw data and model inputs. Consistent feature computation between training and inference prevents training-serving skew.

**Research questions:**
- Is a dedicated feature store needed for V1, or can features be computed inline?
- How do features relate to the Semantic Metrics Layer (Cube) definitions?
- Online vs. offline feature serving requirements?

### 3. Training

**What it does:** Executes model training jobs — from simple scikit-learn models to distributed deep learning. Manages compute allocation, data loading, checkpointing, and distributed training coordination.

**Why it matters:** Training is computationally expensive and must be managed — resource allocation, fault tolerance, reproducibility, and cost tracking.

**Research questions:**
- Single-node vs. distributed training requirements for V1?
- GPU/accelerator provisioning strategy?
- Integration with the secure compute sandbox (training jobs should be isolated)?

### 4. Fine-Tuning

**What it does:** Adapts pre-trained foundation models to domain-specific tasks using organizational data. Supports parameter-efficient fine-tuning (LoRA, QLoRA, adapters) and full fine-tuning.

**Why it matters:** Fine-tuning is the primary mechanism for creating specialist models without training from scratch. PEFT techniques make this feasible on limited hardware.

**IMPORTANT — Model licensing:** Library licenses (PEFT is Apache 2.0, TRL is Apache 2.0) are SEPARATE from base model licenses. Fine-tuned models inherit the base model's license restrictions. Every base model needs individual license review before fine-tuning.

**Research questions:**
- Which base models are viable for fine-tuning under permissive licenses?
- PEFT vs. full fine-tuning — when is each appropriate?
- How does the fine-tuned model's license interact with commercial use?

### 5. Experiment Tracking

**What it does:** Records every training run — hyperparameters, metrics, artifacts, code versions, dataset versions, environment details. Enables comparison, reproducibility, and team collaboration.

**Why it matters:** Without experiment tracking, model development is not reproducible. Teams cannot compare approaches, roll back to previous configurations, or audit what produced a given model.

**Research questions:**
- MLflow vs. building on top of existing observability (Langfuse)?
- Integration with the platform's provenance system?
- How does experiment tracking connect to model evaluation?

### 6. Model Evaluation

**What it does:** Systematically assesses model quality — accuracy, latency, fairness, robustness, safety, cost. Supports automated evaluation suites, human evaluation, and regression testing.

**Why it matters:** Models must be evaluated rigorously before deployment. This is distinct from agent evaluation (covered in evaluation-architecture.md) — this is about the model itself, not the agent that uses it.

**Research questions:**
- How does model evaluation relate to the platform's existing Evaluation capability?
- What evaluation metrics are domain-specific vs. generic?
- How are evaluation results used in deployment decisions (promotion gates)?

### 7. Model Registry

**What it does:** Catalogs trained models with their metadata — version, lineage (dataset + training run), evaluation results, deployment status, ownership, and lifecycle stage (staging, production, archived).

**Why it matters:** The Model Registry is the single source of truth for "what models exist, who owns them, and are they safe to deploy?" Without it, model deployment is ad-hoc and ungoverable.

**Research questions:**
- MLflow Model Registry vs. custom registry?
- Integration with the platform's existing Agent Registry and Tool Registry?
- Model promotion workflow (staging → canary → production)?

### 8. Artifact Registry

**What it does:** Stores and versions binary artifacts — model weights, checkpoints, ONNX exports, tokenizers, configuration files, evaluation reports. Provides immutable storage with access controls.

**Why it matters:** Model artifacts are large binary files that need versioned, immutable storage with access controls. This is separate from the Model Registry (which tracks metadata) — the Artifact Registry stores the actual files.

**Research questions:**
- Object storage (S3/MinIO) vs. dedicated artifact stores?
- Artifact retention and cleanup policies?
- How are artifacts referenced from the Model Registry?

### 9. Model Serving

**What it does:** Deploys trained models for inference — real-time (synchronous API), batch (offline scoring), streaming (continuous inference). Manages scaling, load balancing, A/B testing, and canary deployments.

**Why it matters:** A trained model has no value until it is served. Serving must be reliable, performant, and cost-efficient. Different workloads (real-time classification vs. batch scoring) require different serving patterns.

**Research questions:**
- vLLM for LLM serving vs. BentoML/KServe for general model serving?
- How does model serving integrate with the Model Gateway?
- Auto-scaling and GPU allocation for inference workloads?
- ONNX as a portable model format for cross-framework deployment?

### 10. Model Monitoring

**What it does:** Monitors deployed models in production — data drift detection, prediction drift, performance degradation, latency anomalies, error rates. Triggers alerts and retraining workflows.

**Why it matters:** Model quality degrades over time as input data distributions shift. Without monitoring, the platform silently serves degraded predictions. Monitoring closes the feedback loop from deployment back to training.

**Research questions:**
- Integration with the platform's existing Observability stack (Langfuse + OpenTelemetry)?
- What drift detection algorithms are appropriate?
- How does monitoring trigger retraining workflows (integration with Temporal)?

### 11. Model Provenance

**What it does:** Maintains a complete lineage chain for every model — what data was used, what code produced it, what hyperparameters were set, what evaluation was performed, who approved deployment, and what outcomes followed.

**Why it matters:** Regulatory compliance, audit requirements, and organizational trust all depend on knowing exactly how a model was produced and why it was deployed.

**Research questions:**
- How does model provenance integrate with the platform's existing provenance system?
- What metadata is required for regulatory compliance in the target domains?
- How is provenance maintained through fine-tuning chains (base model → fine-tune → fine-tune)?

---

## Technology Landscape

> All technologies below require individual deep research. Library licenses are listed; model licenses are SEPARATE and require individual review.

| Technology | License | Category | Status |
|-----------|---------|----------|--------|
| PyTorch | BSD-style | Training framework | NOT STARTED |
| fastai | Apache 2.0 | High-level training library (on PyTorch) | NOT STARTED |
| Hugging Face Transformers | Apache 2.0 | Model hub + inference library | NOT STARTED |
| PEFT | Apache 2.0 | Parameter-efficient fine-tuning | NOT STARTED |
| TRL | Apache 2.0 | Transformer reinforcement learning (RLHF/DPO) | NOT STARTED |
| MLflow | Apache 2.0 | Experiment tracking, model registry, deployment | NOT STARTED |
| Ray Train | Apache 2.0 | Distributed training | NOT STARTED |
| Optuna | MIT | Hyperparameter optimization | NOT STARTED |
| vLLM | Apache 2.0 | High-throughput LLM serving | NOT STARTED |
| BentoML | Apache 2.0 | Model serving framework | NOT STARTED |
| KServe | Apache 2.0 | Kubernetes-native model serving | NOT STARTED |
| ONNX | Apache 2.0 | Cross-framework model format | NOT STARTED |

### Model Licensing — CRITICAL SEPARATION

| Concern | What It Covers | License Status |
|---------|---------------|---------------|
| Library code | PyTorch, Transformers, vLLM, PEFT, TRL, etc. | Permissive (Apache 2.0 / BSD / MIT) — free for commercial use |
| Open-weight models | Llama 3, Mistral, Gemma, Qwen, etc. | **VARIES per model** — each needs individual review |
| Fine-tuned models | Custom fine-tunes on any base | Inherit base model license + training data considerations |
| Training data | Datasets used for training | **VARIES per dataset** — license and PII review required |

**Every model adopted for fine-tuning or self-hosting needs its own license review.** The library being Apache 2.0 does NOT mean the model is unrestricted.

---

## Integration with Reference Architecture

```
┌─────────────────────────────────────────────────────────┐
│              INTELLIGENCE CONTROL PLANE                  │
│                                                          │
│   ┌────────────────┐    ┌──────────────────┐            │
│   │ Model Gateway  │    │ ML Platform       │            │
│   │ (LiteLLM)      │    │ (this document)   │            │
│   │                │    │                    │            │
│   │ Foundation     │    │ Custom/Specialist  │            │
│   │ model access   │    │ model lifecycle    │            │
│   │ via API        │    │ (train→serve)      │            │
│   └────────────────┘    └──────────────────┘            │
│            │                      │                      │
│            └──────────┬───────────┘                      │
│                       │                                  │
│              Agent Runtime uses BOTH                     │
│              via unified model interface                 │
└─────────────────────────────────────────────────────────┘
```

- The **Model Gateway** routes to external LLM APIs (Claude, GPT-4, Gemini) and self-hosted models (via vLLM).
- The **ML Platform** manages the lifecycle of custom models: dataset → train → evaluate → register → serve → monitor.
- The **Agent Runtime** consumes both through a unified interface — it does not need to know whether the model is a fine-tuned specialist or an API-served foundation model.

---

## Research Questions (Architecture-Level)

1. **V1 scope:** What ML platform capabilities are needed for V1 vs. V2? Can V1 rely entirely on the Model Gateway (foundation model consumption) and defer custom model development?
2. **MLflow as unifier:** Can MLflow serve as the backbone for experiment tracking, model registry, and artifact management, or does the platform need a custom solution?
3. **Compute isolation:** Training and inference jobs must run in isolated compute (see `architecture/secure-compute-architecture.md`). How does the ML Platform integrate with the secure compute sandbox?
4. **Cost management:** GPU compute is expensive. How does training cost integrate with the platform's Cost/Metering capability?
5. **Ontology integration:** How do trained models relate to the Domain Ontology? Are they registered as ontology objects with typed inputs/outputs?

---

## References

- `architecture/reference-architecture.md` — overall platform architecture
- `architecture/capability-model.md` — capability #4 (Model Gateway), #23 (Evaluation)
- `architecture/secure-compute-architecture.md` — compute isolation for training/inference
- `open-source/model-gateway/litellm.md` — LiteLLM research
- `open-source/ml-infrastructure/README.md` — individual technology research
- `RESEARCH_STATUS.md` — ML/AI Infrastructure status table
