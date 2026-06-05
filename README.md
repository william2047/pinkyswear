# handshook

Handshook is a framework-neutral TypeScript toolkit for defining HTTP API
contracts once and consuming them from both client and server code.

The contract is a plain runtime object. Assertions are the source of runtime
truth, and their return types drive TypeScript inference.

## Install

```sh
npm install handshook
```

## Core Usage

```ts
import { assert, defineApi, endpoint, type Assert } from "handshook";

type Lead = {
  id: string;
  name: string;
};

type CreateLeadBody = {
  name: string;
};

const assertCreateLeadBody: Assert<CreateLeadBody> = (input) => {
  return input as CreateLeadBody;
};

const assertLead: Assert<Lead> = (input) => {
  return input as Lead;
};

export const api = defineApi({
  leads: {
    create: endpoint<{
      body: CreateLeadBody;
      response: Lead;
    }>({
      method: "POST",
      path: "/leads",
      request: {
        body: assert(assertCreateLeadBody)
      },
      response: assert(assertLead)
    })
  }
});
```

The endpoint generic is optional. Without it, Handshook infers request and
response types from assertion functions.

## Browser Client

```ts
import { createClient } from "handshook/browser";
import { api } from "./api";

const client = createClient(api, {
  baseUrl: "/api"
});

const lead = await client.leads.create({
  body: {
    name: "John"
  }
});
```

The client preserves contract nesting, validates outgoing request values,
builds path and query values, parses JSON, validates the response, and returns
`Promise<InferResponse<E>>`.

## Express Tools

```ts
import { createExpressTools } from "handshook/express";
import { api } from "./api";

const expressApi = createExpressTools(api);

app.post(
  expressApi.leads.create.path,
  expressApi.leads.create.middleware,
  async (req, res) => {
    const body = req.handshook?.body;
    const result = await createLead(body);

    res.json(expressApi.leads.create.assertResponse(result));
  }
);
```

The Express adapter preserves contract nesting and exposes each endpoint's
`path`, `method`, `middleware`, and `assertResponse`. Request assertion failures
return `400 Bad Request`.

## Exports

- `handshook` exports `defineApi`, `endpoint`, `assert`, and inference types.
- `handshook/browser` exports `createClient`.
- `handshook/express` exports `createExpressTools`.

## Scripts

- `npm run build` - build `src` into `dist`
- `npm run dev` - watch source files and rebuild on change
- `npm run clean:dist` - remove generated build output
- `npm run clean:modules` - remove installed dependencies
