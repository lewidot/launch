# launch

A web application for managing a Playwright project.

## Development

Clone the required Playwright project into the `server/pw-project` directory.

To start the backend server run:

```bash
bun run dev:server
```

To start the frontend server run:

```bash
bun run dev:frontend
```

## Docker

To run the production build of the application in a Docker container:

```bash
docker-compose up --build
```

To stop the Docker container:

```bash
docker-compose down
```
