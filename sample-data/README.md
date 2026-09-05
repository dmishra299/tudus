# Sample data

Fictional example data for a software architect persona — good for exploring every feature without setting up your own tasks first.

## How to use

Copy both files into the `data/` directory and start the server:

```
mkdir data
cp sample-data/tudus-work.json data/
cp sample-data/tudus-lab.json  data/
node server.js
```

Then open **http://localhost:3003**.

## What's in it

**Work context** — weeks W33–W36 (Aug–Sep 2026), ~15 tasks across a fictional platform engineering workload:
- Tasks with subtasks and Jira / GitHub / Confluence links
- Mix of `todo`, `in-prog`, and `done` statuses
- Carry-forward chain from W33 → W34 (open tasks brought in)
- Date-stamped task notes showing a running log per task
- 3 memos with task links — open the Notes tab to see them

**Lab context** — weeks W35–W36, side projects:
- A reading note turned into an implementation spike
- Carry-forward from W35 → W36
- Two todo tasks to explore next

The "Dedup engine" memo in the Notes tab is linked to both a Work task (the implementation ticket) and a Lab task (the Redis Cluster spike) — a good way to see the memo–task linking feature in action.
