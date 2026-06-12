<!-- =============================================================================================================== -->
<!-- Universitat Politècnica de Catalunya (UPC)                                                                      -->
<!-- =============================================================================================================== -->

# Week 5 demos — orchestration as CLI composition (advanced / optional / ungraded)

These make the **orchestration corollary** concrete: once your agent ships as a CLI
(the Turtle, `../../week-04/demos/turtle/`), multi-agent orchestration is not a new thing
to learn — *another agent's CLI is just another tool*. Every classic pattern falls out of
plain shell composition, with no framework primitive.

The chapters read without these; the code is here for the reader who wants to run the
corollary. Both call the Week-4 Turtle as their child agent — set `TURTLE` to its path, or
run from here with the default relative path.

## `ninja-turtles/splinter.sh` — orchestration is composition

A parent (**Splinter**) delegates to specialist children via `call_cli`, and **the plan
flows from one child to the next as an ordinary shell variable** — no shared typed-state
object, no message bus.

```bash
TURTLE=../../week-04/demos/turtle/turtle.py \
MODEL=qwen3.6:27b OPENAI_BASE_URL=http://localhost:11434/v1 \
./splinter.sh "write a short plan and carry out step 1"
```

In a real topology each role — Leonardo (planner), Donatello (researcher), Michelangelo
(writer), Raphael (executor, strictest allow-list) — is its own Turtle CLI. This toy uses
one Turtle and passes the role in the prompt, to keep the *mechanism* visible.

## `ralph/ralph.sh` — a convergence loop IS bash

A Ralph loop (after Geoffrey Huntley): run the agent on a goal, check whether it converged,
repeat. The agent is a CLI; the convergence check is **another CLI whose exit code is the
handoff protocol.**

```bash
TURTLE=../../week-04/demos/turtle/turtle.py ./ralph/ralph.sh "make ./DONE exist" ./ralph/check_done.sh 5
```

`check_done.sh` is a stand-in: in a real loop it's your test runner, a linter, or a grep
over the output — anything whose exit code means "converged." The loop reads only the code.

**Recursion-depth budgets** (the safety beat in chapter 5.1): a child can spawn its own
children, so the *scaffolding* — not the model — must pass `--depth N` on every child
invocation and refuse to go deeper when `N ≤ 0`. That is the same pre-tool-use hook you met
as a `y`-gate earlier, now bounding recursion.

## 📖 License & author

Licensed under **CC BY-NC-SA 4.0**. © 2026 **Marc Alier i Forment** (UPC) ·
<https://wasabi.essi.upc.edu/ludo> · <https://lamb-project.org>. BSC Agents Course.
