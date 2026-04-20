## ADDED Requirements

### Requirement: Login issues an HttpOnly auth cookie

On a successful `POST /api/auth/login` in the recipe app, the handler SHALL issue a `Set-Cookie` response header named `recipe_auth` carrying the JWT returned by the CMS. The cookie SHALL carry the attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`. The `Secure` attribute SHALL be present when `process.env.NODE_ENV === "production"` and absent otherwise. The HTTP response body SHALL be the JSON object `{"success": true}` and SHALL NOT include the JWT.

#### Scenario: Login sets the HttpOnly cookie and no JWT in body

- **WHEN** `POST /api/auth/login` is invoked with valid credentials and the CMS returns a JWT
- **THEN** the response SHALL set a `Set-Cookie` header whose name is `recipe_auth`
- **AND** the `Set-Cookie` value SHALL contain `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`
- **AND** the response body SHALL be `{"success":true}`
- **AND** the response body SHALL NOT contain the JWT value anywhere

#### Scenario: Production response carries Secure flag

- **WHEN** login succeeds with `process.env.NODE_ENV === "production"`
- **THEN** the `Set-Cookie` value SHALL contain the `Secure` attribute

#### Scenario: Failure responses carry no cookie

- **WHEN** credentials are invalid and CMS login rejects
- **THEN** the handler SHALL respond 400 with `{"success": false}`
- **AND** SHALL NOT emit a `Set-Cookie` header

### Requirement: Logout clears the auth cookie

A `POST /api/auth/logout` handler SHALL, regardless of whether a valid `recipe_auth` cookie was presented, issue a `Set-Cookie` header that clears `recipe_auth` (`Max-Age=0`) and respond 200 with `{"success": true}`. The operation SHALL be idempotent.

#### Scenario: Logout clears cookie when present

- **WHEN** `POST /api/auth/logout` is invoked with a `recipe_auth` cookie attached
- **THEN** the response SHALL set a `Set-Cookie` header whose value clears `recipe_auth` with `Max-Age=0`
- **AND** the response status SHALL be 200

#### Scenario: Logout is idempotent

- **WHEN** `POST /api/auth/logout` is invoked without any `recipe_auth` cookie
- **THEN** the response SHALL still set the clearing `Set-Cookie` header and respond 200

#### Scenario: Logout rejects non-POST methods

- **WHEN** a non-POST request arrives at `/api/auth/logout`
- **THEN** the response SHALL be 405 with an `Allow: POST` header

### Requirement: Protected routes read JWT from cookie, not header

`GET /api/auth/me` and `POST /api/recipe/create` SHALL read the bearer token from the `recipe_auth` request cookie and SHALL NOT accept a `recipe-token` request header or an `Authorization: Bearer …` header. When the cookie is absent or empty, these handlers SHALL respond 401 for `create` and 400 for `me` without calling any CMS service.

#### Scenario: Create route reads JWT from cookie

- **WHEN** `POST /api/recipe/create` is invoked with `req.cookies.recipe_auth = "valid-jwt"` and a valid body
- **THEN** the downstream `createRecipe(body, jwt)` SHALL be called with the raw JWT string `"valid-jwt"` (NOT `"Bearer valid-jwt"`)
- **AND** the response status SHALL be 200

#### Scenario: Create route rejects missing cookie

- **WHEN** `POST /api/recipe/create` is invoked with `req.cookies.recipe_auth` absent
- **THEN** the response status SHALL be 401
- **AND** no CMS-facing `createRecipe` call SHALL be made

#### Scenario: Create route ignores Authorization header

- **WHEN** `POST /api/recipe/create` is invoked with `Authorization: Bearer abc` in headers but no `recipe_auth` cookie
- **THEN** the response status SHALL be 401 (the header SHALL NOT be honored)

#### Scenario: Me route reads JWT from cookie

- **WHEN** `GET /api/auth/me` is invoked with `req.cookies.recipe_auth = "valid-jwt"` and CMS verify succeeds
- **THEN** the response status SHALL be 200 with `{success, account: { id, email, username }}`

### Requirement: Client state MUST NOT persist JWT

The recipe app's Redux `AuthState` SHALL consist of `{ isLoggedIn: boolean }` only. No code in `apps/recipe/src/` SHALL read `state.auth.jwt` or write the JWT to `axios.defaults.headers`, `localStorage`, `sessionStorage`, or any other JS-reachable storage.

#### Scenario: AuthState shape

- **WHEN** the auth slice's `initialState` is inspected
- **THEN** its shape SHALL be `{ isLoggedIn: false }` with no `jwt` key

#### Scenario: No Authorization-header mutation helpers remain

- **WHEN** the source tree is searched for exports named `updateAuthorizationHeader` or `deleteAuthorizationHeader`
- **THEN** no such export SHALL be found in `apps/recipe/src/redux/`

### Requirement: Service-layer accepts raw JWT, constructs Authorization header internally

`createRecipe(recipe, jwt)` in `apps/recipe/src/services/recipe.ts` SHALL accept the raw JWT string as its second argument and SHALL construct the `Authorization: Bearer <jwt>` header inside the service before calling the CMS. Callers at the API-route layer SHALL NOT construct Bearer strings themselves.

#### Scenario: Service builds the Authorization header

- **WHEN** `createRecipe(validRecipe, "abc")` is invoked
- **THEN** the CMS call SHALL carry `Authorization: Bearer abc`
