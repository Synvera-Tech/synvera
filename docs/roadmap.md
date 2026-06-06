# Roadmap

```mermaid
flowchart LR

    Current["Current State
    Embedded JSON"]

    Neon["PostgreSQL
    Neon"]

    Search["Indexed Search"]

    SaaS["Multi-Tenant SaaS"]

    Current --> Neon

    Neon --> Search

    Search --> SaaS
```