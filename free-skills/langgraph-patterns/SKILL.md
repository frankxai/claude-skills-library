---
name: langgraph-patterns
description: Production-grade agentic workflows with LangGraph — graph orchestration, state machines, human-in-the-loop, and advanced control flow. Use when building or debugging a LangGraph app, modeling agent state, or adding checkpoints and human approval steps.
version: 1.0.0
---

# LangGraph Patterns Expert Skill

## Purpose
Master LangGraph for building production-ready AI agents with fine-grained control, checkpointing, streaming, and complex state management.

## When not to use

- General Python utilities (HTTP retries, file parsing, CLIs) that do not involve a LangGraph graph.
- Other agent frameworks (CrewAI, AutoGen, the OpenAI Agents SDK, the Claude Agent SDK), unless the question is how to move to or from LangGraph.
- A framework-neutral architecture review of an LLM system before launch: use `ai-architect-review`.
- Designing the MCP servers an agent calls: use `mcp-architecture`.

## Core Philosophy

**LangGraph is:** An orchestration framework with both declarative and imperative APIs focused on control and durability for production agents.

**Not:** High-level abstractions that hide complexity - instead provides building blocks for full control.

**Migration:** LangGraph replaces legacy AgentExecutor - migrate all old code.

## The Six Production Features

1. **Parallelization** - Run multiple nodes concurrently
2. **Streaming** - Real-time partial outputs
3. **Checkpointing** - Pause/resume execution
4. **Human-in-the-Loop** - Approval/correction workflows
5. **Tracing** - Observability and debugging
6. **Task Queue** - Asynchronous job processing

## Graph-Based Architecture

```python
from langgraph.graph import StateGraph, END

# Define state
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    next_action: str

# Create graph
graph = StateGraph(AgentState)

# Add nodes
graph.add_node("analyze", analyze_node)
graph.add_node("execute", execute_node)
graph.add_node("verify", verify_node)

# Define edges
graph.add_edge("analyze", "execute")
graph.add_conditional_edges(
    "execute",
    should_verify,
    {"yes": "verify", "no": END}
)

# Compile
app = graph.compile()
```

## Core Patterns

### Pattern 1: Agent with Tools
```python
from langgraph.prebuilt import create_react_agent

tools = [search_tool, calculator_tool, db_query_tool]

agent = create_react_agent(
    model=llm,
    tools=tools,
    checkpointer=MemorySaver()
)

# Run with streaming
for chunk in agent.stream({"messages": [("user", "Analyze sales data")]}):
    print(chunk)
```

### Pattern 2: Multi-Agent Collaboration
```python
# Supervisor coordinates specialist agents
supervisor_graph = StateGraph(SupervisorState)

supervisor_graph.add_node("supervisor", supervisor_node)
supervisor_graph.add_node("researcher", researcher_agent)
supervisor_graph.add_node("analyst", analyst_agent)
supervisor_graph.add_node("writer", writer_agent)

# Supervisor routes to specialists
supervisor_graph.add_conditional_edges(
    "supervisor",
    route_to_agent,
    {
        "research": "researcher",
        "analyze": "analyst",
        "write": "writer",
        "finish": END
    }
)
```

### Pattern 3: Human-in-the-Loop
```python
from langgraph.checkpoint.memory import InMemorySaver   # production: a durable saver such as PostgresSaver
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt

def human_approval(state: State) -> dict:
    # interrupt() runs inside a node, at run time. Its argument is what the reviewer sees;
    # its return value is whatever the caller resumes with.
    decision = interrupt({"proposed_action": state["proposed_action"]})
    return {"approved": decision == "approve"}

graph = StateGraph(State)
graph.add_node("propose_action", propose)
graph.add_node("human_approval", human_approval)
graph.add_node("execute_action", execute)
graph.add_edge(START, "propose_action")
graph.add_edge("propose_action", "human_approval")
graph.add_conditional_edges("human_approval", lambda s: "execute_action" if s["approved"] else END)
graph.add_edge("execute_action", END)

# An interrupt needs a checkpointer: the paused state is saved under the thread_id.
app = graph.compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "123"}}

result = app.invoke({"request": "refund order 42"}, config)
# Paused: result["__interrupt__"] carries the payload passed to interrupt().

# Resume the same thread with the human's answer.
app.invoke(Command(resume="approve"), config)
```

Rules that bite:
- **Resume with `Command(resume=...)`.** `app.invoke(None, config)` only continues past a static breakpoint
  (`compile(interrupt_before=[...])`); it does not answer an `interrupt()`.
- **No checkpointer, no resume.** Without one there is nowhere to save the paused state, so the run cannot be
  resumed; use a durable saver (Postgres, SQLite) in production so a pause survives a restart.
- **The node re-runs from its first line on resume.** Keep side effects after `interrupt()`, or make the code before
  it idempotent.
- **Same `thread_id`** for the pause and the resume, or the run starts over.

## State Management

### Short-Term Memory (Session)
```python
class ConversationState(TypedDict):
    messages: Annotated[list, add_messages]
    context: dict

checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

# Maintains context across turns
config = {"configurable": {"thread_id": "user_123"}}
app.invoke({"messages": [("user", "Hello")]}, config)
app.invoke({"messages": [("user", "What did I just say?")]}, config)
```

### Long-Term Memory (Persistent)
```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(db_url)

# Persists across sessions
app = graph.compile(checkpointer=checkpointer)
```

## Advanced Control Flow

### Conditional Routing
```python
def route_next(state):
    if state["confidence"] > 0.9:
        return "approve"
    elif state["confidence"] > 0.5:
        return "review"
    else:
        return "reject"

graph.add_conditional_edges(
    "classifier",
    route_next,
    {
        "approve": "auto_approve",
        "review": "human_review",
        "reject": "reject_node"
    }
)
```

### Cycles and Loops
```python
def should_continue(state):
    if state["iterations"] < 3 and not state["success"]:
        return "retry"
    return "finish"

graph.add_conditional_edges(
    "process",
    should_continue,
    {"retry": "process", "finish": END}
)
```

### Parallel Execution
```python
from langgraph.graph import START

# Fan out to parallel nodes
graph.add_edge(START, ["agent_a", "agent_b", "agent_c"])

# Fan in to aggregator
graph.add_edge(["agent_a", "agent_b", "agent_c"], "synthesize")
```

## Production Deployment

### Streaming for UX
```python
async for event in app.astream_events(input, version="v2"):
    if event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].content, end="")
```

### Error Handling
```python
def error_handler(state):
    try:
        return execute_risky_operation(state)
    except Exception as e:
        return {"error": str(e), "next": "fallback"}

graph.add_node("risky_op", error_handler)
graph.add_conditional_edges(
    "risky_op",
    lambda s: "fallback" if "error" in s else "success"
)
```

### Monitoring with LangSmith
```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "..."

# All agent actions automatically logged to LangSmith
app.invoke(input)
```

## Best Practices

**DO:**
✅ Use checkpointing for long-running tasks
✅ Stream outputs for better UX
✅ Implement human approval for critical actions
✅ Use conditional edges for complex routing
✅ Leverage parallel execution when possible
✅ Monitor with LangSmith in production

**DON'T:**
❌ Use AgentExecutor (deprecated)
❌ Skip error handling on nodes
❌ Forget to set thread_id for stateful conversations
❌ Call `interrupt()` while building the graph, or resume an `interrupt()` with `invoke(None)` (use `Command(resume=...)`)
❌ Over-complicate graphs unnecessarily
❌ Ignore memory management for long conversations

## Integration Examples

### With Claude
```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-5")
agent = create_react_agent(llm, tools)
```

### With OpenAI
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")
agent = create_react_agent(llm, tools)
```

### With MCP Servers
```python
from langchain_mcp import MCPTool

github_tool = MCPTool.from_server("github-mcp")
tools = [github_tool, ...]
agent = create_react_agent(llm, tools)
```

## Decision Framework

**Use LangGraph when:**
- Need fine-grained control over agent execution
- Building complex state machines
- Require human-in-the-loop workflows
- Want production-grade durability (checkpointing)
- Need to support multiple LLM providers

**Use alternatives when:**
- Want managed platform (use OpenAI AgentKit)
- Need visual builder (use AgentKit)
- Want simpler API (use Claude SDK directly)
- Building on Oracle Cloud only (use Oracle ADK)

## Resources

- Docs: https://langchain-ai.github.io/langgraph/
- GitHub: https://github.com/langchain-ai/langgraph
- Tutorials: https://langchain-ai.github.io/langgraph/

---

*LangGraph is the production-grade choice for complex agentic workflows requiring maximum control.*
