"""Expense approval agent (LangGraph 1.x).

The agent reads an expense claim, looks up the policy and the employee's budget with tools, and
proposes approve/reject. Claims above 1,000 EUR must pause for a finance manager's decision
before anything is booked.
"""
from typing import TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import interrupt

from tools import book_expense, get_budget, get_policy

tools = [get_policy, get_budget, book_expense]
llm = ChatAnthropic(model="claude-sonnet-5-5")


class State(TypedDict):
    messages: list
    amount_eur: float
    approved: bool
    review_count: int


def agent(state: State):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


def finance_review(state: State):
    state["review_count"] += 1
    if state["amount_eur"] > 1000:
        decision = interrupt({"question": "Approve this expense?", "amount": state["amount_eur"]})
        state["approved"] = decision == "approve"


def route(state: State):
    last = state["messages"][-1]
    if getattr(last, "tool_calls", None):
        return "tools"
    return "finance_review"


builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_node("tool", ToolNode(tools))
builder.add_node("finance_review", finance_review)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", route)
builder.add_edge("tool", "agent")
builder.add_edge("finance_review", END)

graph = builder.compile()


if __name__ == "__main__":
    claim = "Team offsite dinner, 1,840 EUR, cost centre 4410."
    result = graph.invoke({"messages": [HumanMessage(claim)], "amount_eur": 1840.0, "approved": False, "review_count": 0})
    print(result["approved"])
