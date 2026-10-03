"""Course runtime helpers, executed once inside the Pyodide worker.

Cell code never runs in this module's namespace. Each cell is handed a separate
namespace, so a cell cannot read the runtime's own state, cannot shadow the
helpers below, and cannot leak names into the next cell (doc/DESIGN.md, 浏览器执行模型).

`handle()` is the only entry point the worker calls. It takes a plain dict and
returns a JSON string; it never raises, because an exception in a cell is data
about the cell rather than a failure of the worker.
"""

import ast
import inspect
import json
import sqlite3
import sys
import traceback

# The filename this module was compiled with. Frames carrying it belong to the
# runtime, not to the reader's cell, so they are dropped from tracebacks. Read
# from the code object rather than hardcoded, so the filter cannot drift from
# whatever filename the worker actually used.
_INTERNAL_FILENAME = sys._getframe().f_code.co_filename

# Cells execute with top-level await allowed, so a cell can `await` the way it
# can in a notebook instead of forcing the reader to wrap everything in a task.
_AWAIT_FLAGS = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT

# session name -> {"namespace": dict, "connection": sqlite3.Connection | None}
_sessions = {}


def _new_namespace():
    """A namespace with the baseline environment and nothing else."""
    return {"__name__": "__main__", "__builtins__": __builtins__}


def _session_state(session):
    state = _sessions.get(session)
    if state is None:
        state = {"namespace": _new_namespace(), "connection": None}
        _sessions[session] = state
    return state


async def _settle(value):
    """Await a value when compiling with top-level await made execution suspend."""
    if inspect.isawaitable(value):
        return await value
    return value


async def _execute(source, namespace):
    """Run source, returning the value of a trailing expression if there is one.

    A cell is a sequence of statements, but readers expect the last line of a
    REPL-style cell to show its value. Splitting the trailing expression out of
    the module is what makes both true at once.
    """
    tree = ast.parse(source, "<cell>", "exec")
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        head = ast.Module(body=tree.body[:-1], type_ignores=[])
        ast.fix_missing_locations(head)
        if head.body:
            await _settle(eval(compile(head, "<cell>", "exec", flags=_AWAIT_FLAGS), namespace))
        tail = ast.Expression(body=tree.body[-1].value)
        ast.fix_missing_locations(tail)
        return await _settle(eval(compile(tail, "<cell>", "eval", flags=_AWAIT_FLAGS), namespace))
    await _settle(eval(compile(tree, "<cell>", "exec", flags=_AWAIT_FLAGS), namespace))
    return None


def _one_line(exc):
    text = str(exc).strip().split("\n")
    headline = text[0].strip() if text else ""
    if headline:
        return "%s: %s" % (type(exc).__name__, headline)
    return type(exc).__name__


def _format_exception(exc):
    """Traceback for the reader, with this module's frames removed."""
    if isinstance(exc, SyntaxError):
        # A syntax error has no useful traceback: the caret display is the whole
        # story, and the frames would only show the compiler internals.
        return "".join(traceback.format_exception_only(type(exc), exc)).rstrip()
    entries = [entry for entry in traceback.extract_tb(exc.__traceback__) if entry.filename != _INTERNAL_FILENAME]
    lines = []
    if entries:
        lines.append("Traceback (most recent call last):")
        lines.extend(traceback.format_list(entries))
    lines.extend(traceback.format_exception_only(type(exc), exc))
    return "".join(lines)


def _describe(exc):
    return {
        "kind": "syntax" if isinstance(exc, SyntaxError) else "runtime",
        "message": _one_line(exc),
        "detail": _format_exception(exc).rstrip(),
    }


def _safe_repr(value):
    try:
        return repr(value)
    except Exception as exc:  # a broken __repr__ is the cell's problem, not ours
        return "<repr() failed: %s>" % type(exc).__name__


# ---------------------------------------------------------------------------
# Python cells
# ---------------------------------------------------------------------------


async def run_python(source, session):
    namespace = _new_namespace() if session is None else _session_state(session)["namespace"]
    try:
        value = await _execute(source, namespace)
    except BaseException as exc:
        return json.dumps({"result": None, "error": _describe(exc)})
    if value is None:
        return json.dumps({"result": None, "error": None})
    return json.dumps({"result": {"kind": "repr", "text": _safe_repr(value)}, "error": None})


# ---------------------------------------------------------------------------
# SQL cells
# ---------------------------------------------------------------------------


def _split_statements(text):
    """Split on complete statements, the same way the SQLite CLI does."""
    statements = []
    buffer = ""
    for line in text.splitlines(keepends=True):
        buffer += line
        if sqlite3.complete_statement(buffer):
            if buffer.strip():
                statements.append(buffer.strip())
            buffer = ""
    if buffer.strip():
        statements.append(buffer.strip())
    return statements


def _connection(session, fixture_sql):
    """A fresh connection per cell, or the session's connection when named.

    A named session loads its fixture exactly once. Which fixture belongs to
    which session is a build-time question (doc/DESIGN.md, 创作与渲染模型), so the
    runtime does not re-check it here.
    """
    if session is None:
        connection = sqlite3.connect(":memory:")
        connection.executescript(fixture_sql)
        return connection

    state = _session_state(session)
    if state["connection"] is None:
        connection = sqlite3.connect(":memory:")
        connection.executescript(fixture_sql)
        state["connection"] = connection
    return state["connection"]


def _tag(value):
    """Tag a SQLite value so the UI can tell NULL, 0 and '' apart (doc/DESIGN.md, 浏览器执行模型).

    SQLite columns carry an affinity, not a type, so the tag records what the
    value actually is in this row rather than what the schema declared.
    """
    if value is None:
        return {"kind": "null"}
    if isinstance(value, bool):
        return {"kind": "integer", "value": int(value)}
    if isinstance(value, int):
        return {"kind": "integer", "value": value}
    if isinstance(value, float):
        return {"kind": "real", "value": value}
    if isinstance(value, (bytes, bytearray, memoryview)):
        return {"kind": "blob", "bytes": len(bytes(value))}
    return {"kind": "text", "value": str(value)}


def _statement_label(statement):
    line = statement.strip().split("\n", 1)[0].strip()
    return line if len(line) <= 80 else line[:77] + "..."


def run_sql(source, session, fixture_sql, max_rows):
    try:
        connection = _connection(session, fixture_sql)
    except Exception as exc:
        return json.dumps({"results": [], "error": _describe(exc)})

    results = []
    try:
        for statement in _split_statements(source):
            cursor = connection.execute(statement)
            if cursor.description is None:
                results.append(
                    {
                        "kind": "affected",
                        "rows": cursor.rowcount if cursor.rowcount > 0 else 0,
                        "statement": _statement_label(statement),
                    }
                )
                continue
            columns = [column[0] for column in cursor.description]
            # One row past the cap is enough to know the result was cut short.
            fetched = cursor.fetchmany(max_rows + 1)
            truncated = len(fetched) > max_rows
            rows = [[_tag(cell) for cell in row] for row in fetched[:max_rows]]
            results.append({"kind": "table", "columns": columns, "rows": rows, "truncated": truncated})
    except Exception as exc:
        return json.dumps({"results": results, "error": _describe(exc)})
    return json.dumps({"results": results, "error": None})


# ---------------------------------------------------------------------------
# Session lifecycle
# ---------------------------------------------------------------------------


def reset_session(session):
    state = _sessions.pop(session, None)
    if state is not None and state["connection"] is not None:
        try:
            state["connection"].close()
        except Exception:
            pass
    return json.dumps({"ok": True})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def handle(request):
    """Dispatch one worker request. Always returns a JSON string."""
    # JS objects arrive as a JsProxy; convert once so the rest of this module
    # works with an ordinary dict.
    if hasattr(request, "to_py"):
        request = request.to_py()
    kind = request["type"]
    if kind == "run-python":
        return await run_python(request["source"], request.get("session"))
    if kind == "run-sql":
        return run_sql(request["source"], request.get("session"), request["fixtureSql"], request["maxRows"])
    if kind == "reset-session":
        return reset_session(request["session"])
    return json.dumps(
        {"results": [], "error": {"kind": "internal", "message": "unknown request type %r" % (kind,)}}
    )
