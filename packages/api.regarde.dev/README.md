# api.regarde.dev API Server

This worker provides an HTTP API for registering and checking nicknames for the regarde.bio. It uses Jazz to store the nickname-to-AccountID mappings in a `CoMap` owned by the worker itself.

## Prerequisites

- Node.js (version recommended by Jazz.tool, typically latest LTS)
- npm or yarn

## Setup

1.  **Install Dependencies**:
    Navigate to this directory (`packages/regarde.bio/workers`) and run:
    ```bash
    npm install
    # or
    # yarn install
    ```

2.  **Jazz Worker Credentials**:
    This worker needs its own Jazz Account. Generate credentials using the Jazz CLI:
    ```bash
    npx jazz-run account create --name "NicknameRegistryWorker"
    ```
    This command will output an `Account ID` and an `Account Secret`.

3.  **Environment Variables**:
    Create a `.env` file in this directory (`packages/regarde.bio/workers/.env`) or set the following environment variables in your deployment environment:

    ```env
    JAZZ_WORKER_ACCOUNT="<WORKER_ACCOUNT_ID_FROM_STEP_2>"
    JAZZ_WORKER_SECRET="<WORKER_ACCOUNT_SECRET_FROM_STEP_2>"
    JAZZ_SYNC_SERVER_URL="<YOUR_JAZZ_SYNC_SERVER_URL_OR_DEFAULT_WSS_CLOUD_JAZZ_TOOLS>"
    # Optional: If your Jazz server requires an API key for workers
    # JAZZ_API_KEY="<YOUR_JAZZ_API_KEY>" 
    PORT="3000" # Or any port you want the worker to listen on
    ```
    Replace placeholders with your actual values. The `.gitignore` file is already configured to ignore `.env`.

## Running the Worker

-   **Build TypeScript**:
    ```bash
    npm run build
    ```

-   **Start the Worker**:
    ```bash
    npm start
    ```
    This will start the HTTP server on the configured `PORT`.

-   **Development Mode (auto-rebuild and restart)**:
    ```bash
    npm run dev
    ```

## API

### Register a Nickname

-   **Endpoint**: `/register`
-   **Method**: `POST`
-   **Request Body** (JSON):
    ```json
    {
      "nickname": "your_desired_nickname",
      "jazzAccountID": "user_jazz_account_id"
    }
    ```
-   **Responses**:
    -   `204 No Content`: Nickname successfully registered.
    -   `409 Conflict`: Nickname is already taken.
        ```json
        { "error": "Nickname already taken" }
        ```
    -   `400 Bad Request`: Invalid request body.
        ```json
        { "error": "Invalid request body. Nickname and jazzAccountID are required and must be strings." }
        ```
    -   `500 Internal Server Error`: Other server-side errors.

## How it Works

The worker maintains a `NicknameRegistry` `co.record` (a type of `CoMap`) in its own Jazz Account's root. This map stores `nickname` as the key and `jazzAccountID` as the value.

When a `/register` request comes in:
1. The worker loads its `NicknameRegistry`.
2. It checks if the requested `nickname` already exists as a key.
3. If not, it adds the mapping.
4. If it exists, it returns a conflict error.

The schema for the registry and the worker's account is defined in `src/schema.ts`. The main worker logic is in `src/index.ts`.
