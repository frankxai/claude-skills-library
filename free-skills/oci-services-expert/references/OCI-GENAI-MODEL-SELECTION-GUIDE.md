# OCI Generative AI - Model Selection Guide for AI Architects

> **Purpose:** Expert-level decision framework for selecting the right OCI GenAI model.
> **Audience:** Solution Architects, AI Engineers, Technical Decision Makers
> **Last Verified:** 2026-02-03
> **Source:** [Oracle Official Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)

---

## Executive Summary

OCI Generative AI provides **20+ models across 6 providers** (Cohere, Meta, Google, xAI, OpenAI-OSS). Selecting the right model requires understanding:

1. **Task requirements** (reasoning, multimodal, coding, RAG)
2. **Operational constraints** (data residency, latency, cost)
3. **Customization needs** (fine-tuning, few-shot, prompting)

**Key Insight:** No single model is optimal for all tasks. World-class AI Architects match models to workloads.

---

## Part 1: Decision Framework

### Primary Decision Tree

```
START: What is the primary task?
│
├─► REASONING (complex logic, multi-step)
│   ├─► Data must stay in EU? → Cohere Command A Reasoning
│   ├─► Need 2M+ context? → Grok 4.1 Fast
│   └─► General enterprise? → Cohere Command A Reasoning OR Gemini 2.5 Pro
│
├─► MULTIMODAL (images, charts, documents)
│   ├─► Understanding charts/diagrams? → Cohere Command A Vision
│   ├─► General image understanding? → Llama 3.2 90B Vision
│   └─► Multimodal + reasoning? → Gemini 2.5 Pro
│
├─► CODING (generation, review, debugging)
│   ├─► Pure coding tasks? → Grok Code Fast 1
│   ├─► Coding + agentic workflows? → Llama 4 Maverick
│   └─► Code in broader context? → Cohere Command A
│
├─► RAG / RETRIEVAL
│   ├─► Embeddings needed? → Cohere Embed 4 (multimodal) or Embed Multilingual 3
│   ├─► Reranking search results? → Cohere Rerank 3.5
│   └─► Generation from retrieved context? → Cohere Command R (08-2024)
│
├─► AGENTIC (tool-calling, multi-step workflows)
│   ├─► MoE architecture preferred? → Llama 4 Maverick
│   ├─► Reduced hallucinations critical? → Grok 4.1 Fast
│   └─► Enterprise + EU compliant? → Cohere Command A Reasoning
│
├─► HIGH-VOLUME / BUDGET
│   ├─► Maximum cost efficiency? → Gemini 2.5 Flash-Lite
│   ├─► Lightweight reasoning? → Grok 3 Mini Fast
│   └─► Simple generation tasks? → Llama 3.3 70B (on-demand)
│
└─► FINE-TUNING / CUSTOMIZATION
    ├─► Open-source base? → Llama 3.3 70B (LoRA)
    ├─► Maximum quality fine-tune? → Llama 3.1 405B (LoRA)
    └─► Enterprise fine-tune? → Cohere Command (T-few/Vanilla)
```

---

## Part 2: Model Catalog with Agentic Thinking

### 2.1 Cohere Models (Enterprise Partner)

**Strategic Position:** Enterprise-grade, EU-deployable, RAG-optimized

| Model | Context | Strengths | Best For | Agentic Capability |
|-------|---------|-----------|----------|-------------------|
| **Command A Reasoning** | 256K | Multi-step logic, structured arguments | Complex Q&A, document review, legal analysis | ★★★★★ Advanced tool-calling |
| **Command A Vision** | - | Chart/diagram understanding | Visual document analysis, infographics | ★★★★☆ Visual reasoning |
| **Command A** | 256K | General enterprise tasks | Content creation, summarization | ★★★★☆ Standard tool-calling |
| **Command R (08-2024)** | 128K | RAG-optimized | Retrieval-augmented generation | ★★★☆☆ Basic |
| **Command R+ (08-2024)** | 128K | Higher capacity | Complex retrieval tasks | ★★★☆☆ Basic |

**Embed Models:**
| Model | Type | Dimensions | Use Case |
|-------|------|------------|----------|
| Embed 4 | Multimodal | - | Text + image embeddings |
| Embed Multilingual 3 | Text | - | 100+ languages |
| Embed English 3 | Text | - | English-optimized |
| Embed Light variants | Text/Multimodal | - | Cost-optimized |

**Rerank:**
- **Rerank 3.5** - Takes query + candidate list, returns relevance-scored ordering

**When to Choose Cohere:**
- ✅ EU data residency requirements
- ✅ Enterprise compliance needed
- ✅ RAG/retrieval-heavy workloads
- ✅ Need embeddings + generation in same provider
- ❌ Pure coding tasks (use Grok)
- ❌ Need 2M+ context (use Grok)

---

### 2.2 Meta Llama Models (Open-Source, Fine-Tunable)

**Strategic Position:** Open-source, fine-tunable, agentic-ready

| Model | Context | Strengths | Best For | Fine-Tuning |
|-------|---------|-----------|----------|-------------|
| **Llama 4 Maverick** | - | MoE, multimodal, multilingual | Advanced agentic workflows | Not yet |
| **Llama 4 Scout** | - | MoE, efficient | Cost-effective agentic | Not yet |
| **Llama 3.3 70B** | - | Best text performance per size | Fine-tuning base | LoRA supported |
| **Llama 3.2 90B Vision** | - | Text + image | Multimodal tasks | Limited |
| **Llama 3.2 11B Vision** | - | Compact multimodal | Smaller deployments | Limited |
| **Llama 3.1 405B** | - | Best-in-class text | Maximum quality fine-tune | LoRA supported |

**Agentic Architecture (Llama 4):**
```
┌─────────────────────────────────────────────────────────────┐
│                   LLAMA 4 MAVERICK MoE                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Expert  │  │ Expert  │  │ Expert  │  │ Expert  │        │
│  │ Coding  │  │ Reason  │  │ Vision  │  │ Language│        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    Router Layer                              │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              │   Tool Orchestrator  │                        │
│              │   • API Calls        │                        │
│              │   • Code Execution   │                        │
│              │   • Database Access  │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**When to Choose Llama:**
- ✅ Need fine-tuning on proprietary data
- ✅ Building agentic systems with tool-calling
- ✅ Open-source licensing requirements
- ✅ MoE efficiency for complex tasks
- ❌ EU data residency critical (use Cohere)
- ❌ Pure RAG workloads (use Cohere)

---

### 2.3 xAI Grok Models (Speed + Coding)

**Strategic Position:** Massive context, coding specialist, reduced hallucinations

| Model | Context | Strengths | Best For | Speed |
|-------|---------|-----------|----------|-------|
| **Grok Code Fast 1** | - | Coding-focused | TypeScript, Python, Java, Rust, C++, Go | Fast |
| **Grok 4.1 Fast** | **2M** | ~3x reduced hallucinations | Complex real-world, customer support | Fast |
| **Grok 4** | - | Domain expertise | Finance, healthcare, law, science | Standard |
| **Grok 3** | - | Enterprise tasks | Data extraction, summarization | Standard |
| **Grok 3 Mini** | - | Lightweight + thinking | Logic-based tasks | Fast |

**Grok Code Fast 1 - Agentic Coding Workflow:**
```
┌─────────────────────────────────────────────────────────────┐
│              GROK CODE FAST 1 WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PLAN     → Analyze requirements, identify components     │
│       │                                                      │
│  2. WRITE    → Generate code (TS/Python/Java/Rust/C++/Go)   │
│       │                                                      │
│  3. TEST     → Create unit tests, integration tests          │
│       │                                                      │
│  4. DEBUG    → Identify issues, propose fixes                │
│       │                                                      │
│  5. ITERATE  → Refine based on feedback                      │
│                                                              │
│  Supported: Full agentic coding workflows with tool access   │
└─────────────────────────────────────────────────────────────┘
```

**When to Choose Grok:**
- ✅ Coding-heavy workloads
- ✅ Need 2M token context
- ✅ Hallucination reduction critical
- ✅ Speed + quality balance
- ❌ Multimodal image tasks (use Cohere Vision)
- ❌ Fine-tuning needed (use Llama)

---

### 2.4 Google Gemini Models (Multimodal)

**Strategic Position:** Multimodal native, thinking features, Google ecosystem

| Model | Multimodal | Strengths | Best For | Thinking |
|-------|------------|-----------|----------|----------|
| **Gemini 2.5 Pro** | Yes | Advanced reasoning | Complex problem-solving | Extended |
| **Gemini 2.5 Flash** | Yes | Balanced speed/intelligence | Production multimodal | Standard |
| **Gemini 2.5 Flash-Lite** | Yes | Budget-friendly | High-volume, low-complexity | Minimal |

**Note:** Oracle is the only hyperscaler (besides GCP) to offer Gemini as a managed service.

**When to Choose Gemini:**
- ✅ Multimodal tasks (text + image + audio + video)
- ✅ Need "thinking" features for complex reasoning
- ✅ Budget optimization with Flash-Lite
- ❌ EU data residency (use Cohere)
- ❌ Fine-tuning (use Llama)

---

### 2.5 OpenAI-OSS Models

| Model | Parameters | Best For |
|-------|------------|----------|
| gpt-oss-120b | 120B | Large-scale generation |
| gpt-oss-20b | 20B | Smaller deployments |

---

## Part 3: Fine-Tuning Strategy

### Decision: When to Fine-Tune vs. Prompt Engineering

```
┌─────────────────────────────────────────────────────────────┐
│              FINE-TUNING DECISION FRAMEWORK                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Q1: Is task performance acceptable with prompting alone?    │
│      YES → Use prompt engineering, few-shot examples         │
│      NO  → Continue to Q2                                    │
│                                                              │
│  Q2: Do you have 100+ high-quality training examples?        │
│      NO  → Improve prompt engineering first                  │
│      YES → Continue to Q3                                    │
│                                                              │
│  Q3: Is the task domain-specific and consistent?             │
│      NO  → Stick with larger general model                   │
│      YES → Fine-tuning recommended                           │
│                                                              │
│  Q4: What's your base model preference?                      │
│      Open-source → Llama 3.3 70B (LoRA)                     │
│      Maximum quality → Llama 3.1 405B (LoRA)                │
│      Enterprise → Cohere Command (T-few/Vanilla)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fine-Tuning Methods on OCI

| Method | Models | Data Required | Use Case |
|--------|--------|---------------|----------|
| **LoRA** | Llama 3.3, 3.1 | 100+ examples | Domain adaptation, style |
| **T-few** | Cohere Command | Few examples | Quick task adaptation |
| **Vanilla** | Cohere Command | More examples | Deep customization |

### Dedicated AI Cluster Requirements

- **Fine-tuning:** Requires 2 units (more GPUs)
- **Hosting:** Requires 1+ units
- **Note:** Clusters are tenant-exclusive, not shared

---

## Part 4: Cost Optimization Patterns

### Pattern 1: Tiered Model Routing

```
┌─────────────────────────────────────────────────────────────┐
│                 TIERED MODEL ROUTING                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Incoming Request                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │ Complexity      │                                        │
│  │ Classifier      │  (Use Haiku/Flash-Lite)                │
│  └────────┬────────┘                                        │
│           │                                                  │
│     ┌─────┴─────┬─────────────┐                             │
│     ▼           ▼             ▼                             │
│  SIMPLE      MEDIUM       COMPLEX                           │
│  Flash-Lite  Flash        Pro/Command A                     │
│  ~$0.04      ~$0.08       ~$0.15                            │
│                                                              │
│  Result: 40-70% cost reduction vs. always using Pro         │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Draft-Refine Pipeline

```
Draft 1-3: Gemini Flash-Lite ($0.04 × 3 = $0.12)
    ↓
Refinement: Gemini Flash ($0.08)
    ↓
Polish: Cohere Command A ($0.15)

Total: $0.35 vs. $0.45 (all Command A) = 22% savings
```

### Pattern 3: Specialized Model Chains

```
Document Processing Pipeline:
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ OCI Doc     │ → │ Cohere      │ → │ Cohere      │
│ Understanding│   │ Embed 4     │   │ Command R   │
│ (Extract)   │   │ (Vectorize) │   │ (Generate)  │
└─────────────┘   └─────────────┘   └─────────────┘
  Purpose-built     Best embeddings   RAG-optimized
```

---

## Part 5: Reference Architecture Patterns

### 5.1 Enterprise RAG Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ENTERPRISE RAG ON OCI                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Documents → OCI Doc Understanding → Chunks                  │
│                                        │                     │
│                                        ▼                     │
│                              Cohere Embed Multilingual 3     │
│                                        │                     │
│                                        ▼                     │
│                         ┌──────────────────────────┐        │
│                         │   Autonomous Database     │        │
│                         │   23ai Vector Store       │        │
│                         └──────────────────────────┘        │
│                                        │                     │
│  User Query → Cohere Embed → Vector Search → Top-K          │
│                                        │                     │
│                                        ▼                     │
│                              Cohere Rerank 3.5               │
│                                        │                     │
│                                        ▼                     │
│                              Cohere Command R                │
│                                        │                     │
│                                        ▼                     │
│                                   Response                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Agentic Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              AGENTIC WORKFLOW ON OCI                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Request                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │        Llama 4 Maverick (Orchestrator)   │                │
│  │        • Plan decomposition              │                │
│  │        • Tool selection                  │                │
│  │        • State management                │                │
│  └───────────────┬─────────────────────────┘                │
│                  │                                           │
│     ┌────────────┼────────────┬────────────┐                │
│     ▼            ▼            ▼            ▼                │
│  ┌──────┐   ┌──────┐    ┌──────┐    ┌──────┐               │
│  │ API  │   │ Code │    │ DB   │    │ Search│               │
│  │ Tool │   │ Exec │    │ Query│    │ Tool │               │
│  └──────┘   └──────┘    └──────┘    └──────┘               │
│                                                              │
│  Specialist Models (called as needed):                       │
│  • Grok Code Fast 1 → Code generation                       │
│  • Cohere Command A Vision → Document analysis              │
│  • Cohere Embed 4 → Retrieval                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Compliance & Data Residency

### EU Data Residency

| Provider | EU Deployable | Regions |
|----------|---------------|---------|
| **Cohere** | ✅ Yes | EU OCI regions |
| Meta Llama | Check availability | Varies |
| Google Gemini | Check availability | Varies |
| xAI Grok | Check availability | Varies |

**For EU-regulated industries (GDPR, financial services):** Default to Cohere models.

---

## Part 7: Model Deprecation & Lifecycle

**Important:** OCI GenAI models have lifecycle policies.

| Status | Meaning |
|--------|---------|
| **Available** | Fully supported, use freely |
| **Deprecated** | Still works, will retire in 6+ months |
| **Retired** | No longer available |

**API Note:** GenerateText and SummarizeText APIs deprecated as of June 2026. Use Chat API.

---

## Quick Reference Card

### By Task (Top Pick)

| Task | Model |
|------|-------|
| Complex reasoning | Cohere Command A Reasoning |
| Multimodal | Cohere Command A Vision |
| Coding | Grok Code Fast 1 |
| RAG | Cohere Command R + Embed + Rerank |
| Agentic | Llama 4 Maverick |
| Budget | Gemini 2.5 Flash-Lite |
| Long context | Grok 4.1 Fast (2M) |
| EU compliant | Cohere (any) |
| Fine-tuning | Llama 3.3 70B |

### By Provider Strength

| Provider | Primary Strength |
|----------|------------------|
| **Cohere** | Enterprise RAG, EU compliance |
| **Llama** | Fine-tuning, open-source, agentic |
| **Grok** | Coding, long context, speed |
| **Gemini** | Multimodal, thinking |

---

## References

- [OCI Pretrained Models](https://docs.oracle.com/en-us/iaas/Content/generative-ai/pretrained-models.htm)
- [OCI GenAI Concepts](https://docs.oracle.com/en-us/iaas/Content/generative-ai/concepts.htm)
- [Cohere Partnership](https://www.oracle.com/artificial-intelligence/generative-ai/generative-ai-service/cohere/)
- [OCI Fine-tuning](https://docs.oracle.com/en-us/iaas/Content/generative-ai/fine-tune-models.htm)
- [Dedicated AI Clusters](https://docs.oracle.com/en-us/iaas/Content/generative-ai/ai-cluster.htm)
- [oracle-devrel/oci-genai-finetuning](https://github.com/oracle-devrel/oci-genai-finetuning)

---

*OCI GenAI Model Selection Guide v1.0 | 2026-02-03*
*For AI Architects by AI Architects*
