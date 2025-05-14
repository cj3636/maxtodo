import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/cloudflare";
import { useLoaderData, Form } from "@remix-run/react";
import { TodoManager } from "~/to-do-manager";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("Missing list ID", { status: 400 });
  }

  const key = `todos:${id}`;
  const manager = new TodoManager(context.env.TO_DO_LIST, key);
  const todos = await manager.list();
  return json({ todos });
};

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("Missing list ID", { status: 400 });
  }

  const key = `todos:${id}`;
  const manager = new TodoManager(context.env.TO_DO_LIST, key);
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create": {
      const text = formData.get("text");
      if (typeof text !== "string" || !text) {
        return json({ error: "Invalid text" }, { status: 400 });
      }
      await manager.create(text);
      break;
    }

    case "toggle": {
      const todoId = formData.get("id");
      if (typeof todoId !== "string") {
        return json({ error: "Invalid ID" }, { status: 400 });
      }
      await manager.toggle(todoId);
      break;
    }

    case "delete": {
      const todoId = formData.get("id");
      if (typeof todoId !== "string") {
        return json({ error: "Invalid ID" }, { status: 400 });
      }
      await manager.delete(todoId);
      break;
    }

    default:
      return json({ error: "Invalid intent" }, { status: 400 });
  }

  return redirect(`/${id}`);
}

export default function TodoRoute() {
  const { todos } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          Todo List
        </h1>

        <Form method="post" className="mb-8 flex gap-2">
          <input
            type="text"
            name="text"
            className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm px-4 py-2"
            placeholder="Add a new todo..."
          />
          <button
            type="submit"
            name="intent"
            value="create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Add
          </button>
        </Form>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <Form method="post" className="flex-1 flex items-center gap-2">
                <input type="hidden" name="id" value={todo.id} />
                <button
                  type="submit"
                  name="intent"
                  value="toggle"
                  className="text-gray-500 hover:text-blue-500"
                >
                  <span
                    className={
                      todo.completed ? "line-through text-gray-400" : ""
                    }
                  >
                    {todo.text}
                  </span>
                </button>
              </Form>

              <Form method="post">
                <input type="hidden" name="id" value={todo.id} />
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </Form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
