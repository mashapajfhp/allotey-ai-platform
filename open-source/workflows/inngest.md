# Inngest (inngest/inngest)

**STATUS: NOT STARTED**
**License:** SSPL (NEEDS VERIFICATION -- may have changed)
**Repository:** https://github.com/inngest/inngest
**SDKs:** TypeScript, Python, Go

---

## Overview

Inngest is an event-driven durable execution platform for serverless background
jobs. Founded in 2021, it was built around a specific mental model: events trigger
functions, functions are made of steps, and steps are individually durable.

Inngest invokes functions through secure HTTP calls, managing the entire durable
execution and queueing system as a service. No separate worker infrastructure
to manage.

---

## Core Concepts

### Functions

An Inngest function is a serverless function triggered by an event. Functions
contain steps that are individually durable and retriable.

### Steps

The fundamental unit of durable execution. Code within each `step.run()` is:
- **Checkpointed:** Progress is saved after each step completes
- **Retriable:** Automatically retried on error
- **Memoized:** Completed steps are not re-executed on retry

### Sleep

`step.sleep()` can suspend a workflow mid-execution for seconds or months at
zero cost. No polling loops, no cron jobs, no workers spinning. Resumes exactly
where it stopped.

### Fan-Out

A single event can trigger multiple functions simultaneously. Useful for:
- Sending notifications across channels
- Updating multiple databases
- Running parallel processing pipelines

### Retries

Automatic retries with configurable policies. State persists across retries
so functions continue from the point of failure, not from the beginning.

---

## Simpler Model Than Temporal

Inngest trades some of Temporal's power for significantly simpler operations:
- No workflow server cluster to manage
- No separate database to configure
- No worker fleet to deploy
- Functions are standard HTTP endpoints
- Works naturally with serverless platforms (Vercel, Netlify, AWS Lambda)

The trade-off: less control over consistency, no saga pattern support
(NEEDS VERIFICATION), and less proven at massive scale.

---

## Key Questions

- [ ] SSPL licensing implications for a platform product?
- [ ] Can Inngest handle long-running agent workflows (hours/days)?
- [ ] What are the scale limits compared to Temporal?
- [ ] Self-hosted Inngest operational complexity?
- [ ] How does Inngest handle multi-tenancy?

---

## References

- Inngest Documentation: https://www.inngest.com/docs
- Inngest GitHub: https://github.com/inngest/inngest
- Steps Documentation: https://www.inngest.com/docs/learn/inngest-steps
