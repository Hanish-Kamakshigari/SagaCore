# Google Cloud Agent Builder Integration Guide

This guide details how to migrate the local SAGACORE agent to **Google Cloud Agent Builder** (Conversational Agent Console) and hook up your persistent MongoDB Atlas database layer as custom OpenAPI tools.

---

## 1. Setup in Google Cloud Console

1. **Activate APIs**: Enable the **Dialogflow API** and **Vertex AI API** in your Google Cloud Console project.
2. **Create the Agent**:
   - Navigate to **Agent Builder** in your Google Cloud Console.
   - Click **Create Agent** → select **Conversational Agent** (Playbook-based).
   - Enter your agent settings (e.g., Name: `SagaCore Architect`).
3. **Register Custom OpenAPI Tools**:
   - In your Agent Builder console, go to **Tools** → **Create**.
   - Select **OpenAPI** as the tool type.
   - Copy and paste the OpenAPI 3.0 specification supplied below in Section 2.
   - Specify your Next.js application API route as the target endpoint (or configure webhook authentication if staging to production).

---

## 2. Custom Tools OpenAPI 3.0 Specification

Copy and paste the following OpenAPI spec into the **OpenAPI Tool Definition** box in Agent Builder:

```yaml
openapi: 3.0.3
info:
  title: SAGACORE Realm Database Services
  version: 1.0.0
  description: Real-time Mongoose MongoDB persistence services for player state, codex logs, and quest campaigns.
servers:
  - url: https://your-sagacore-domain.vercel.app/api/agent-hook
paths:
  /realm-state:
    post:
      summary: Retrieve the player's active level, XP, and theme
      operationId: getRealmState
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userId:
                  type: string
                  description: The unique Firebase user ID of the active player.
              required:
                - userId
      responses:
        '200':
          description: Active player state returned successfully.
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  xp:
                    type: integer
                  level:
                    type: integer
                  worldTheme:
                    type: string

  /complete-quest:
    post:
      summary: Mark an active quest as completed in MongoDB
      operationId: completeQuest
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                  description: The unique integer ID of the quest to mark as completed.
                userId:
                  type: string
                  description: The unique Firebase user ID.
              required:
                - id
                - userId
      responses:
        '200':
          description: Quest updated successfully.

  /save-quest:
    post:
      summary: Autonomously save newly forged quest details to MongoDB
      operationId: saveQuestToDatabase
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userId:
                  type: string
                id:
                  type: integer
                title:
                  type: string
                description:
                  type: string
                category:
                  type: string
                  enum: [wisdom, discipline, creation]
                difficulty:
                  type: string
                  enum: [Common, Rare, Epic, Legendary]
                xp:
                  type: integer
                tasks:
                  type: array
                  items:
                    type: string
                mythEvent:
                  type: string
              required:
                - userId
                - id
                - title
                - description
                - category
                - difficulty
                - xp
                - tasks
      responses:
        '200':
          description: Quest persistently stored.

  /save-chapter:
    post:
      summary: Persistently store a new lore codex chapter to MongoDB
      operationId: saveChapterToDatabase
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userId:
                  type: string
                id:
                  type: integer
                title:
                  type: string
                text:
                  type: string
              required:
                - userId
                - id
                - title
                - text
      responses:
        '200':
          description: Codex chapter scribed successfully.
```

---

## 3. Configuring Environment Variables

Add the following parameters to your `.env` configuration file to activate the **Google Cloud Agent Builder** integration inside your server runner:

```env
# Google Cloud Agent Builder Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_AGENT_ID=your-dialogflow-cx-agent-id
GCP_LOCATION=global # e.g. global, us-central1
```

Once defined, the SAGACORE backend will automatically migrate all narrative and quest forging queries to your custom Agent Builder playbook instance. Removing or emptying these variables will fall back to local direct Gemini API function-calling loops.
