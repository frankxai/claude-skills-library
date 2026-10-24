---
type: llm
weight: 2
---
Judge only the final answer. The material under review was checked and the following are all implemented correctly in it:
- `messages` uses the `add_messages` reducer
- the model is bound to the read-only tools with `bind_tools`; booking is not a model tool
- the tool node is named `tools` and `add_conditional_edges` has an explicit path map
- `finance_review` returns update dicts and does not mutate state
- the graph is compiled with a `PostgresSaver` checkpointer and invoked with a `thread_id` and `recursion_limit`
- the interrupt is resumed with `Command(resume=decision)` on the same config
- the agent loop is bounded by `MAX_AGENT_STEPS`
- `propose` turns the agent's findings into a structured approve/reject; claims up to 1,000 EUR follow it, and claims above 1,000 EUR (or ones the agent could not finish checking) pause for a finance manager with the proposal shown
- when the step limit stops the agent with tool calls pending, `propose` escalates without calling the model

The complete source follows. Treat it as ground truth.

`expense_agent.py`:

```python
"""Expense approval agent (LangGraph 1.x).

The agent reads an expense claim, looks up the policy and the employee's budget with tools, and
proposes approve/reject. Claims up to 1,000 EUR follow that proposal. Claims above 1,000 EUR, or
claims the agent could not finish checking, pause for a finance manager's decision before anything
is booked.
"""
from typing import Annotated, Literal, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AnyMessage, HumanMessage
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.types import Command, interrupt
from pydantic import BaseModel

from tools import get_budget, get_policy

read_tools = [get_policy, get_budget]          # booking happens only after approval, outside the model
llm = ChatAnthropic(model="claude-sonnet-5-5").bind_tools(read_tools)
MAX_AGENT_STEPS = 6


class Proposal(BaseModel):
    decision: Literal["approve", "reject"]
    reason: str


proposer = ChatAnthropic(model="claude-sonnet-5-5").with_structured_output(Proposal)


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    amount_eur: float
    approved: bool
    agent_steps: int
    proposal: Literal["approve", "reject", "escalate"]
    reason: str


def agent(state: State):
    response = llm.invoke(state["messages"])
    return {"messages": [response], "agent_steps": state["agent_steps"] + 1}


def propose(state: State):
    if getattr(state["messages"][-1], "tool_calls", None):
        # The step limit stopped the agent mid-check; a model call now would carry unanswered tool calls.
        return {"proposal": "escalate", "reason": "agent step limit reached before the policy and budget checks finished"}
    p = proposer.invoke(state["messages"] + [HumanMessage("Given the policy and budget results above, approve or reject this claim, with the reason.")])
    return {"proposal": p.decision, "reason": p.reason}


def finance_review(state: State):
    if state["amount_eur"] <= 1000 and state["proposal"] != "escalate":
        return {"approved": state["proposal"] == "approve"}
    decision = interrupt({
        "question": "Approve this expense?",
        "amount": state["amount_eur"],
        "agent_proposal": state["proposal"],
        "reason": state["reason"],
    })
    return {"approved": decision == "approve"}


def route(state: State):
    last = state["messages"][-1]
    if getattr(last, "tool_calls", None) and state["agent_steps"] < MAX_AGENT_STEPS:
        return "tools"
    return "propose"


builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(read_tools))
builder.add_node("propose", propose)
builder.add_node("finance_review", finance_review)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", route, {"tools": "tools", "propose": "propose"})
builder.add_edge("tools", "agent")
builder.add_edge("propose", "finance_review")
builder.add_edge("finance_review", END)


def run(claim_id: str, claim: str, amount_eur: float, db_uri: str):
    with PostgresSaver.from_conn_string(db_uri) as checkpointer:
        checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer)
        config = {"configurable": {"thread_id": f"expense-{claim_id}"}, "recursion_limit": 20}
        result = graph.invoke(
            {"messages": [HumanMessage(claim)], "amount_eur": amount_eur, "approved": False, "agent_steps": 0,
             "proposal": "escalate", "reason": ""},
            config,
        )
        return graph, config, result


def resume(graph, config, decision: str):
    return graph.invoke(Command(resume=decision), config)
```

FAIL if the final answer claims that any item in the list above is missing, broken, insecure or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example a missing checkpointer, a missing reducer on `messages`, or unbound tools, all of which the source shows are handled.

FAIL if the final answer does not actually review the material (for example it only asks for the files or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
