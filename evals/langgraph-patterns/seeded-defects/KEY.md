# Answer key: langgraph-patterns seeded-defects

Never staged into a run (scripts/eval-skill.mjs NEVER_STAGED).

1. **interrupt-no-checkpointer** (hitl): `interrupt()` in `finance_review` used while the graph is compiled with `builder.compile()` and no checkpointer, so the pause cannot be persisted or resumed → fix: compiling with a checkpointer (e.g. a Postgres or memory saver) and resuming with `Command(resume=...)`
2. **no-thread-id** (hitl): `graph.invoke(...)` called without a `config` containing `configurable.thread_id`, which a checkpointed graph needs to store and resume the interrupted run → fix: passing `{"configurable": {"thread_id": ...}}` on invoke and on resume
3. **messages-no-reducer** (state): `messages: list` in `State` declared without a reducer, so each node's returned `messages` replaces the history instead of appending → fix: declaring `messages: Annotated[list, add_messages]` (or another appending reducer)
4. **route-name-mismatch** (routing): `route` returning `"tools"` while the tool node is registered as `"tool"`, so the conditional edge points at a node that does not exist → fix: using the same node name (or giving `add_conditional_edges` an explicit path map)
5. **tools-not-bound** (tools): the model created with `ChatAnthropic(...)` but never given the tools (`bind_tools`), so it cannot emit tool calls and the tool node never runs → fix: calling `llm.bind_tools(tools)`
6. **node-mutates-state** (state): `finance_review` mutating `state` in place (`state["review_count"] += 1`, `state["approved"] = ...`) and returning nothing, so the updates are not applied to graph state → fix: returning a dict of updates such as `{"approved": ...}`
7. **unsafe-tool-before-approval** (hitl): `book_expense` being available to the model as a tool, so the agent can book the expense before the finance manager approves claims above 1,000 EUR → fix: removing booking from the model's tools and booking only after approval
