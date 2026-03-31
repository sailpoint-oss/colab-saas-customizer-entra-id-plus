## SaaS Connector Customizer Template

A **template** for building SailPoint SaaS Connector Customizers that extend any [supported SaaS connector](https://developer.sailpoint.com/docs/connectivity/saas-connectivity/customizers) with custom account and entitlement attributes. The included implementation targets **Microsoft Entra ID** (sponsors & application parsing), but the framework is connector-agnostic — swap the API client and operations for any connector.

---

### Architecture

```
index.ts                      ← entry point: wires handlers to SDK commands
├── customOperations.ts       ← operation maps defining when logic runs (before/after hooks)
├── operationRunner.ts        ← generic engine: runBeforeOperations / runAfterOperations
├── utils.ts                  ← general utilities
├── model/
│   ├── operation.ts          ← Operation / OperationMap type definitions
│   └── config.ts             ← connector configuration interface
├── operations/               ← your custom operation functions live here
│   ├── setSponsors.ts        ← (Entra ID) handles deferred sponsor writes and clears (preSetSponsors, setSponsors)
│   ├── getSponsors.ts        ← (Entra ID) after: fetches sponsors from Graph
│   ├── setGuestGalVisibility.ts ← (Entra ID) after: enforce guest GAL visibility
│   └── getApplication.ts     ← (Entra ID) after: parse application from entitlement name
└── entraid-client.ts         ← (Entra ID) Microsoft Graph API wrapper
```

### How it works

1. **`index.ts`** registers a single before-handler and a single after-handler for every standard SDK command (account list/read/create/update/disable/enable/unlock, change-password, entitlement list/read).

2. Each handler delegates to the **operation runner** in `operationRunner.ts`, which iterates an **operation map** — a plain object that maps a hook pattern to an array of functions:

    ```typescript
    // customOperations.ts
    export const customOperations: CustomOperationMap = {
        'afterStdAccountCreate.sponsors': [setSponsors], // hookPattern.attributePattern → Array of functions
    }
    ```

3. **Before operations** transform the SDK input in a pipeline (each function receives the input and returns a partial object to merge into the input). They only run when the input contains the relevant attribute, or unconditionally if mapped to `*.*`.

4. **After operations** run against every output object. Each function receives the object and returns a partial object that the engine merges with the current item.

5. Hook paths follow the `<hookPattern>.<attributePattern>` convention:
    - `'beforeStdAccountCreate.sponsors'` → runs on beforeStdAccountCreate when 'sponsors' attribute is present
    - `'afterStdAccountRead.*'` → runs on afterStdAccountRead unconditionally for all attributes
    - `'*.*'` → runs on all hooks unconditionally

---

### Quick start — adding a custom attribute

**1. Write your operation** in `src/operations/`:

```typescript
// src/operations/myCustomAttr.ts
import { Context, readConfig } from '@sailpoint/connector-sdk'
import { AnyAfterOperationInput, AfterOperation } from '../model/operation'
import { Config } from '../model/config'
import { getLogger } from '../utils'

export const myCustomAttr: AfterOperation<AnyAfterOperationInput> = async (context: Context, output: AnyAfterOperationInput) => {
    const config: Config = await readConfig()
    const logger = getLogger(config.spConnDebugLoggingEnabled)

    // Your logic here — call an API, derive a value, etc.
    logger.debug(`Computing custom attr`)
    const computedValue = 'computed-value'
    
    // Return an object that will be merged into the current item
    return {
        attributes: {
            ...output.attributes,
            myCustomAttr: computedValue
        }
    }
}
```

**2. Register it** in the operation map:

```typescript
// src/customOperations.ts
import { myCustomAttr } from './operations/myCustomAttr'

export const customOperations: CustomOperationMap = {
    'afterStdAccountCreate.sponsors': [setSponsors],
    'afterStdAccountRead.*': [myCustomAttr], // ← new: runs on after read unconditionally
}
```

That's it. The framework handles hook matching, iteration, merging the returned object, and logging.

---

### Adapting for a different connector

The only Entra ID-specific files are:

| File                                      | Purpose                                |
| ----------------------------------------- | -------------------------------------- |
| `src/entraid-client.ts`                   | Microsoft Graph API wrapper            |
| `src/operations/setSponsors.ts`           | Handles deferred sponsor writes/clears |
| `src/operations/getSponsors.ts`           | After-op: fetches current sponsors     |
| `src/operations/getApplication.ts`        | After-op: parse app from entitlement   |
| `src/operations/setGuestGalVisibility.ts` | After-op: enforce guest GAL visibility |
| `src/model/config.ts`                     | Entra ID connector config interface    |

Everything else (`index.ts`, `operationRunner.ts`, `utils.ts`, `model/operation.ts`, `customOperations.ts`) is generic framework code. To target a different connector:

1. Replace `entraid-client.ts` with a client for your target API
2. Update `config.ts` to match your connector's configuration schema
3. Write new operations in `src/operations/`
4. Wire them into the hook patterns in `customOperations.ts`

---

### Included Entra ID operations

#### Sponsors (account attribute)

| Phase  | Operation             | What it does                                                                                                                                                                                                                    |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before | `preSetSponsors`      | Intercepts sponsor changes in the input. For **update** commands, applies them immediately via Graph API. For **create** commands, defers the write (user doesn't exist yet) and caches the pending change for the after phase. Located in `setSponsors.ts`. |
| After  | `setSponsors`         | If a deferred sponsor change was cached (create flow), applies it now that the user exists. Located in `setSponsors.ts`.                                                                                                          |
| After  | `getSponsors`         | Fetches current sponsors from `GET /users/{id}/sponsors` and returns UPN(s). Runs during reads and lists.                                                                                                                       |

Sponsors are a **navigation property** in Microsoft Graph (not a direct attribute), so the base connector cannot read/write them natively. This combination of operations handles them transparently.

#### Guest GAL Visibility (account attribute)

| Phase | Operation               | What it does                                                                                                                                                                                       |
| ----- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| After | `setGuestGalVisibility` | For `Guest` users, enforces their visibility in the Exchange Global Address List by calling the Graph API to set `showInAddressList: true` upon account creation or update. Skips non-Guest users. |

#### Application (entitlement attribute)

| Phase | Operation        | What it does                                                                                                 |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| After | `getApplication` | For `applicationRole` entitlements, splits `displayName` on `[on]` and returns the application name portion. |

---

### Configuration

The customizer reuses the same configuration as the base connector. The key fields used by the included Entra ID operations are:

| Field                       | Used for                                                |
| --------------------------- | ------------------------------------------------------- |
| `domainName`                | Entra ID tenant ID (passed to `ClientSecretCredential`) |
| `clientID`                  | Application (client) ID                                 |
| `clientSecret`              | Application secret                                      |
| `spConnDebugLoggingEnabled` | Toggles debug-level logging                             |

No additional configuration is required beyond what the base connector provides.

---

### Build & development

```bash
npm install           # install dependencies
npm run build         # clean + compile (via @vercel/ncc)
npm run dev           # run locally with source maps (spcx)
npm run debug         # run locally without rebuild
npm run pack-zip      # package for deployment (spcx package)
```

### Deployment

1. `npm run build` (or `npm run prepack-zip`)
2. `npm run pack-zip` → creates a deployable ZIP
3. Upload to ISC as a SaaS connector customizer
4. Link to your source and enable the relevant before/after operations

---

### Logging

Controlled by `spConnDebugLoggingEnabled`:

-   `true` → `logger.level = 'debug'` (verbose operation tracing)
-   `false` → `logger.level = 'info'` (production)

---

### Troubleshooting

| Symptom                                         | Likely cause                                                                                                                                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth errors from Graph                          | Check `clientID`, `clientSecret`, `domainName` and required Graph permissions (`User.Read.All`, `Directory.Read.All`)                                                                                      |
| Missing attributes on output                    | Verify the incoming object contains the fields your operations use (`objectId`, `userPrincipalName`, `uuid`, `type`). Add null checks as needed.                                                           |
| 404 on aggregation with `sponsors` in `$select` | `sponsors` is a Graph navigation property (requires `$expand`, not `$select`). Configure the attribute in ISC so the base connector does not fetch it — the customizer handles it via a separate API call. |
| Graph throttling / failures                     | Check logs for `Error fetching ...` messages. Consider adding retry/backoff in the client methods.                                                                                                         |

---

### Dependencies

| Package                                      | Purpose                                            |
| -------------------------------------------- | -------------------------------------------------- |
| `@sailpoint/connector-sdk`                   | Customizer runtime, logger, config                 |
| `@azure/identity`                            | Entra ID authentication (`ClientSecretCredential`) |
| `@microsoft/microsoft-graph-client`          | Microsoft Graph API client                         |
| `isomorphic-fetch`                           | Fetch polyfill for Node.js                         |
| `@vercel/ncc`                                | Single-file bundling                               |
| `cross-env`, `shx`, `typescript`, `prettier` | Build tooling                                      |

---

### License

MIT — see `LICENSE.txt`.
