---
name: grill-mich
description: Interviews the user about a new feature idea in structured rounds until every design decision is settled, before any code gets written. Use this whenever the user pitches a new feature, brings up wanting to build/add something new, or explicitly asks for /grill-mich — don't jump straight into implementation planning on a vague feature idea, run this interview first so nothing gets silently assumed.
---

Run a relentless interview to turn a vague feature idea into a shared, fully-specified understanding — before any implementation planning happens. Do not act on the feature until the user confirms the understanding is complete.

## Why rounds, not one big question dump

A real feature idea is a tree of decisions: the top-level choice (what problem, for whom) determines which second-level choices even make sense, and those in turn gate a third level. Asking everything at once forces the user to guess at answers to questions whose premises don't exist yet, and asking one question at a time is needlessly slow. Rounds solve both: each round asks everything that's currently answerable, and each answer can unlock the next round's questions.

## The frontier

The "frontier" is every decision whose prerequisites are already settled — the questions that can be asked right now without guessing at an answer the user hasn't given yet. A question whose answer depends on something still open this round belongs to a later round.

Work in rounds:

1. Look at what's settled so far (nothing, on round 1) and compute the frontier: every open decision you could ask about right now.
2. Ask the whole frontier in a single round — don't trickle questions out one at a time, and don't hold a question back if it's genuinely askable now.
3. Wait for the user's answers. Do not guess ahead or ask a second round in the same turn.
4. Each answer can settle a decision, which pushes the frontier outward and may unblock questions that depended on it. Recompute the frontier for the next round.
5. Repeat until the frontier is empty — every branch of the tree visited, nothing left as a silent assumption.

The session is done only when the frontier is empty and the user confirms the shared understanding is right. Don't start implementing based on a partial round.

## Finding facts vs. asking questions

Only put decisions to the user — things only they can decide (scope, priorities, tradeoffs, what "done" means for them). Never ask the user something you could look up yourself.

When a frontier question needs a fact about the codebase (does a model/field already exist, how is a similar feature currently built, what does the existing API/schema look like), dispatch a subagent (Explore or Agent) to find it instead of asking. This is not a reason to stall the whole round: a running exploration is just one more unsettled prerequisite. Ask every other question in the frontier that doesn't depend on it now, and only the questions genuinely downstream of that fact wait for the subagent's report.

## Round format

Number every question, and give a recommended answer for each — the user is allowed to just say "go with your recommendations" instead of answering one by one, so the recommendation has to be a real, defensible default, not a placeholder.

```text
**Q1** - **<question title>**: <question body, can be multiple paragraphs, can include multiple-choice options>

Recommended -> <your recommended answer, with a short reason>

---

**Q2** - **<question title>**: <question body>

Recommended -> <your recommended answer, with a short reason>
```

Keep each question concrete and answerable in a sentence or a pick from options — avoid open-ended essay prompts unless the decision genuinely has no small answer space.

## What the tree typically covers

Not a fixed checklist — skip branches that don't apply, and add branches this specific feature needs. As a starting shape for this codebase (Recur: Spring Boot backend, React/TS frontend):

- **Problem & scope**: what user problem, for whom, what's explicitly out of scope for v1
- **Data model impact**: new fields/entities on `Task` or a new model entirely; migration needed
- **Backend surface**: new/changed endpoints, validation rules (recall `Task.OnCreate` — POST vs PATCH semantics), owner-scoping
- **Frontend surface**: which component(s)/page(s), new context or reuse of `TasksContext`/`AddTaskContext`, form via Formik+Yup if input is involved
- **Edge cases & failure modes**: what happens on conflicting/duplicate/expired state, empty states, concurrent edits
- **Non-goals**: what this feature explicitly should NOT do, so later rounds don't creep scope back in

## Closing the loop

When the frontier is empty, summarize the full settled design back to the user in one message (not another round of questions) and ask for explicit confirmation before treating the interview as done. Only after that confirmation should planning/implementation start — and only if the user separately asks for it.
