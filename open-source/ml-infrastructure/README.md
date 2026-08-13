# ML Infrastructure Research

> STATUS: NOT STARTED
> Last updated: 2026-08-13

Research into open-source ML/AI infrastructure libraries and frameworks for custom/specialist model development. These are SEPARATE from foundation model consumption via the Model Gateway (LiteLLM).

**IMPORTANT:** Library licenses are separate from model licenses. Every model needs individual license review. The library being Apache 2.0 does NOT mean the model is unrestricted.

See `architecture/ml-platform-architecture.md` for the architectural context.

---

## Research Queue

| Project | License | Category | Status | Notes |
|---------|---------|----------|--------|-------|
| PyTorch | BSD-style | Core ML training framework | NOT STARTED | Foundation for all deep learning work |
| fastai | Apache 2.0 | High-level training library (on PyTorch) | NOT STARTED | Simplifies common training patterns |
| Hugging Face Transformers | Apache 2.0 | Model hub + inference library | NOT STARTED | Library is free; individual models have separate licenses |
| PEFT | Apache 2.0 | Parameter-efficient fine-tuning (LoRA, QLoRA, adapters) | NOT STARTED | Critical for domain-specific model adaptation |
| TRL | Apache 2.0 | Transformer reinforcement learning (RLHF, DPO) | NOT STARTED | Alignment and reward model training |
| MLflow | Apache 2.0 | Experiment tracking, model registry, deployment | NOT STARTED | Potential backbone for ML platform capabilities |
| Ray Train | Apache 2.0 | Distributed training and compute | NOT STARTED | Anyscale is paid hosted option; Ray itself is open |
| Optuna | MIT | Hyperparameter optimization | NOT STARTED | Automated hyperparameter search |
| vLLM | Apache 2.0 | High-throughput LLM serving engine | NOT STARTED | Primary candidate for self-hosted LLM inference |
| BentoML | Apache 2.0 | Model serving framework | NOT STARTED | BentoCloud is paid hosted option; core is open |
| KServe | Apache 2.0 | Kubernetes-native model serving | NOT STARTED | CNCF project for ML serving on K8s |
| ONNX | Apache 2.0 | Cross-framework model format | NOT STARTED | Portable model representation |

---

## Research Template

Each project research file should cover:
1. **License verification** — confirm license, identify any dual-licensing or commercial tiers
2. **Architecture fit** — how does this integrate with the platform's ML Platform architecture?
3. **Self-hosted viability** — can this run entirely self-hosted without vendor dependencies?
4. **Operational complexity** — what infrastructure does it require?
5. **Community and maturity** — activity, governance, release cadence
6. **Adopt/Wrap/Study decision** — recommendation for the platform
