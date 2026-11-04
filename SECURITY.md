# Security Policy

## Scope

This policy applies to the Craftflow frontend and the files maintained in this repository. It does not define the security policy of separately operated backend, orchestration, identity, or infrastructure services.

This repository is an isolated frontend workspace. Do not copy backend source code, production customer data, credentials, or other protected repository content into it.

## Reporting a vulnerability

**Do not report security vulnerabilities in public GitHub issues, discussions, pull requests, or commit messages.**

1. If GitHub's **Security** tab offers **Report a vulnerability** for this repository, use that private reporting route.
2. If private vulnerability reporting is not available, contact the repository administrators through a verified private channel associated with the owning GitHub organization. No dedicated security email address is currently published in this repository.

Please include, where possible:

- the affected branch and commit SHA;
- the affected file or component;
- a concise description of the impact and conditions required;
- reproducible steps or a minimal proof of concept;
- any suggested mitigation.

Redact tokens, passwords, session cookies, personal data, customer records, and production identifiers from the report. Do not attach unredacted logs, browser storage, environment files, or request/response headers.

Do not access, modify, export, or delete data that does not belong to you. Do not run destructive tests, load tests, or active tests against production systems without explicit authorization from the system owner.

## Credentials and configuration

- Never commit API keys, passwords, access tokens, OAuth client secrets, private keys, certificates, session cookies, or populated `.env` files.
- Keep local configuration in ignored files such as `.env.local`. The checked-in `.env.example` must contain placeholders or empty values only.
- **Every `VITE_*` variable is public.** Vite embeds these values into browser-delivered assets. Use them only for non-secret configuration, such as a public API base URL.
- Do not attempt to secure a value by obfuscating it, encoding it, or placing it in a frontend constant.
- Secrets needed by automation belong in GitHub Actions encrypted secrets or in the relevant operator-managed secret store. Runtime authorization and credential validation belong on the server.
- Do not log credentials or include them in test artifacts, screenshots, crash reports, or evidence files.

The frontend validates its factory base URL and rejects embedded URL credentials, query strings, fragments, and non-HTTPS remote URLs. This validation is a client-side configuration safeguard; it is not a substitute for server-side authentication, authorization, or input validation.

## Data handling and repository hygiene

Do not commit:

- personal or customer data, production exports, or non-public business records;
- authentication cookies, browser storage, authorization headers, or unredacted HTTP traces;
- secrets, populated environment files, or private-key material;
- backend implementation files or copies of other protected repositories.

Audit and evidence documents may contain operational metadata such as environment hostnames, service references, deployment identifiers, workflow/run identifiers, and correlation IDs. These values are not necessarily authentication credentials, but they can reveal internal architecture or operational activity. Minimize them and review them before publishing the repository, sharing an archive, or attaching evidence to an issue.

The repository's `.gitignore` excludes `.env` and `.env.*` while explicitly allowing `.env.example`. This is a safeguard, not a guarantee: review staged changes before every commit.

## If a credential is exposed

Treat any credential committed to the repository or disclosed in an artifact as compromised, even if the commit is later reverted or the file is deleted.

1. Revoke or rotate the credential at the issuing service immediately.
2. Notify the relevant system owner and review the credential's access/activity logs.
3. Remove the value from the working tree and prevent it from being reintroduced.
4. Coordinate any required Git-history cleanup with repository administrators. History rewriting does **not** replace revocation or rotation.
5. Re-scan the repository and affected artifacts before resuming use.

Do not paste the exposed value into an issue, chat, report, or follow-up commit.

## Existing automated checks

The main CI workflow runs TypeScript checks, frontend tests, Node-based governance/release-gate tests, a production build, and `npm audit --omit=dev --audit-level=high`.

The dependency audit is limited to the production dependency tree and the configured high-severity threshold. A successful CI run is not a complete application security assessment and must not be treated as proof that no secrets, vulnerabilities, or unsafe configurations exist.

## Response and disclosure

The maintainers will assess reports, determine affected components, and coordinate remediation and disclosure with the reporter where practical. This repository does not currently publish a guaranteed response time, security support matrix, or service-level agreement.

Please allow the maintainers a reasonable opportunity to investigate and release a fix before making technical details public. Coordinated disclosure does not authorize access to production systems or data.

## Related repository guidance

- [README.md](README.md) — setup, runtime modes, and project boundaries.
- [AGENTS.md](AGENTS.md) — repository access boundaries, role-specific write scopes, and human approval requirements.
