# OCI Services Expert

Expert guidance on Oracle Cloud Infrastructure services, cloud architecture patterns, cost optimization, deployment strategies, and OCI best practices for enterprise solutions.

## Quick Reference

**When to Use**: OCI architecture, cost optimization, deployment planning
**Scope**: All OCI services - compute, storage, networking, AI, database
**Perspective**: Enterprise architect with multi-cloud awareness

## Core Service Categories

### Compute
- **Compute Instances**: Flexible VMs, Bare Metal
- **OKE**: Managed Kubernetes
- **Container Instances**: Serverless containers
- **Functions**: Event-driven serverless

### Storage
- **Object Storage**: Data lakes, backups (11 9s durability)
- **Block Volume**: High-IOPS databases
- **File Storage**: NFS shared filesystems

### Database
- **Autonomous DB**: Self-driving ATP/ADW
- **Base Database**: Traditional Oracle DB
- **MySQL HeatWave**: Analytics-accelerated MySQL

### AI Services
- **Generative AI**: LLMs (Cohere, Llama, custom)
- **AI Services**: Vision, Language, Speech
- **Data Science**: ML model development

### Networking
- **VCN**: Virtual networks
- **Load Balancer**: L4/L7 balancing
- **FastConnect**: Dedicated private connection

## Architecture Patterns

### Three-Tier Web App
```
Internet → Load Balancer → Compute (Auto-scaling) → Autonomous DB
              ↓
          WAF (DDoS)
```

### Microservices on OKE
```
API Gateway → OKE Cluster → Service Mesh → ADB per service
                ↓
         Container Registry
```

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| Reserved Capacity | Up to 72% |
| Preemptible Instances | 50-70% |
| Archive Storage | 90% vs Standard |
| Auto-scaling | Pay for actual use |

---

## 💰 OCI VERIFIED PRICING (January 2026)

> **IMPORTANT**: This pricing is verified against official Oracle sources. Always confirm at [oracle.com/cloud/price-list](https://www.oracle.com/cloud/price-list/) for the latest rates.

### Always Free Tier (No Time Limit)

| Resource | Free Allocation | Notes |
|----------|-----------------|-------|
| **Autonomous Database** | 2 instances (20GB each) | ATP, ADW, or AJD |
| **Ampere A1 Compute** | 3,000 OCPU-hours + 18,000 GB-hours/mo | Shared across VM/Container Instances |
| **Flexible Load Balancer** | 1 LB (10 Mbps) | Layer 7 with SSL |
| **Network Load Balancer** | 1 NLB | Layer 4, fully free |
| **Object Storage** | 10GB Standard + 10GB Archive | |
| **Data Egress** | 10 TB/month | Per region |
| **VCNs** | 2 VCNs | |
| **Block Volume** | 200GB total | |

⚠️ **Idle Reclamation**: Always Free compute may be reclaimed if CPU <20% for 7 days.

### Compute Pricing

| Shape | Type | Price | Notes |
|-------|------|-------|-------|
| **VM.Standard.A1.Flex** | Ampere ARM | **$0.0165/OCPU-hr** | Best value; first 3,000 hrs FREE |
| **VM.Standard.E4.Flex** | AMD EPYC | $0.025/OCPU-hr | |
| **VM.Standard3.Flex** | Intel | $0.032/OCPU-hr | |
| **Container Instance** | Ampere A1 | **$0.0165/OCPU-hr** | Uses same free tier pool |
| **BM.GPU.H100.8** | 8x H100 GPUs | ~$30/hr | AI/ML workloads |

**Monthly Estimate (1 OCPU, 4GB)**: ~$12-24/mo (or FREE within Always Free)

### Database Pricing

| Service | Price | Notes |
|---------|-------|-------|
| **Autonomous DB (Always Free)** | **$0** | 2 instances, 20GB each |
| **Autonomous DB (Paid)** | $0.336/OCPU-hr | License included |
| **Autonomous DB (BYOL)** | $0.0807/OCPU-hr | 76% savings with own license |
| **Paid AJD Minimum** | ~$238/mo | 2 ECPU + 1TB continuous |
| **Elastic Pools** | Up to 87% savings | Consolidate multiple ADBs |

### Storage Pricing

| Tier | Price/GB/Month | Use Case |
|------|----------------|----------|
| **Object Storage (Standard)** | **$0.0255** | Hot data, images, assets |
| **Object Storage (Infrequent)** | $0.018 + $0.01/GB retrieval | Cooler data |
| **Archive Storage** | **$0.0026** | Long-term retention |
| **Block Volume** | $0.0255 | Persistent disk |
| **Block Volume Backup** | $0.005 | |

**Example**: 50GB Object Storage = **$1.28/mo**

### Networking Pricing

| Service | Price | Notes |
|---------|-------|-------|
| **Flexible Load Balancer (L7)** | $0.018/hr base + $0.005/GB | ~$13-20/mo |
| **Network Load Balancer (L4)** | **FREE** | No hourly or data charges |
| **Data Egress (first 10TB)** | **FREE** | Per region |
| **Data Egress (beyond 10TB)** | $0.0085/GB | Much cheaper than AWS |
| **Intra-region traffic** | **FREE** | Between ADs |
| **FastConnect** | From $0.30/hr (1 Gbps) | Dedicated connection |

### Generative AI Pricing

| Model | Input Tokens | Output Tokens |
|-------|--------------|---------------|
| **Cohere Command A** | ~$0.0015/1K | ~$0.002/1K |
| **Cohere Embed** | ~$0.0001/1K | N/A |
| **Llama 4 Models** | ~$0.001/1K | ~$0.002/1K |

### Cost Comparison vs AWS

| Scenario | OCI | AWS | Savings |
|----------|-----|-----|---------|
| **50TB Egress** | ~$340 | ~$4,500 | **92%** |
| **1 OCPU VM/mo** | ~$12 | ~$35 | **66%** |
| **100GB Object Storage** | $2.55 | $2.30 | Similar |
| **Load Balancer** | $13-20/mo | $18-25/mo | ~20% |

### Architecture Cost Examples

**Personal Blog (Next.js)**:
| Component | Monthly Cost |
|-----------|-------------|
| Autonomous JSON DB | $0 (Always Free) |
| Container Instance (1 OCPU) | $0-18 (Free tier covers) |
| Object Storage (50GB) | $1.28 |
| Network Load Balancer | $0 (Free) |
| Egress (<10TB) | $0 |
| **TOTAL** | **$0-20/mo** |

**Small SaaS App**:
| Component | Monthly Cost |
|-----------|-------------|
| Autonomous DB (2 ECPU) | ~$240 |
| OKE Cluster (3 nodes) | ~$150 |
| Load Balancer (100 Mbps) | ~$50 |
| Object Storage (500GB) | ~$13 |
| **TOTAL** | **~$450/mo** |

### Pricing Verification Resources

- **Official Price List**: https://www.oracle.com/cloud/price-list/
- **Cost Estimator**: https://www.oracle.com/cloud/costestimator.html
- **Always Free Docs**: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm

> **Last Verified**: January 2026
> **Source**: Oracle official documentation and price lists

---

## OCI vs Other Clouds

**OCI Strengths**:
- Oracle DB workloads: Best performance + licensing
- Cost: 20-40% cheaper than AWS/Azure
- Predictable pricing: No surprise egress fees
- Bare metal performance: RDMA, NVMe

**Choose OCI for**:
- Oracle Database migration
- High-performance computing
- Cost-sensitive projects
- Existing Oracle infrastructure

## Related Skills
- `oracle-adk` - AI agent development
- `oracle-database-expert` - Database optimization
- `oracle-agent-spec` - Agent definitions

---

*See SKILL.md for comprehensive service documentation and deployment patterns.*
