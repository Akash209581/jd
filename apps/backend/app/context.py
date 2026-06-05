import contextvars

# Contextvar to hold the current authenticated user's ID
current_user_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("current_user_id", default=None)
