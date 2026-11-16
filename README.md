# منصة ابن الهيثم

The project is a Docker Compose web application with two services:

- `frontend/` contains the sign-in/register page, dashboard, styles, browser
  behavior, and Nginx configuration.
- `backend/` contains the Node.js API. It hashes passwords and checks credentials
  against SQLite.
- `database/data/app.db` is the SQLite database file containing registered
  accounts. The folder is mounted into the backend container so the file is
  directly available in the project.

## Run with Docker

From the project root, start the application with:

```sh
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080), create an account, and then
log in to reach the student dashboard. The dashboard includes course cards and
a daily study checklist whose progress is kept for the current browser session.
Nginx forwards `/api/` requests to the backend.

## Docker concepts demonstrated

- Docker Compose starts the frontend and backend together.
- `./database/data:/app/data` mounts the SQLite file folder into the backend.
  Registered accounts remain in `database/data/app.db` when containers stop or
  are recreated.
- `./backend:/app` is a bind mount for backend development. The separate
  `backend_node_modules` volume keeps container dependencies available despite
  the bind mount.
- Frontend HTML, CSS, and JavaScript files are bind-mounted read-only into
  Nginx, so saved frontend changes appear after refreshing the browser.

The backend runs in watch mode, so saved `backend/server.js` changes restart it
automatically. Refresh the browser after saving frontend files; use `Ctrl+F5`
if the browser still shows a cached version.

To stop the containers while keeping account data, run `docker compose down`.
To erase all accounts, stop the containers and delete `database/data/app.db`.
