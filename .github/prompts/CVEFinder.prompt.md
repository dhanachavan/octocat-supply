---
description: 'Deep CVE inspection workflow: find vulnerabilities, create remediation issues, and assign to Copilot.'
tools: ['search', 'read', 'edit', 'web', 'github/*', 'github-remote/*']
---

# CVE Finder + Remediation Issue Automation

Perform a deep security inspection of this repository and identify potential CVEs and known vulnerable dependencies.

## Objectives

1. Find vulnerabilities with enough evidence to remediate.
2. Create **one GitHub issue per vulnerability** using GitHub MCP tools.
3. Assign each created issue to **Copilot** for remediation.
4. Make each issue self-contained so a Copilot Coding Agent can implement fixes without follow-up.

## Required Workflow

### 1) Deep inspection

Inspect all relevant areas:

- Dependency manifests and lock files (`package.json`, `package-lock.json`, `requirements*.txt`, `pyproject.toml`, etc.)
- CI/CD and GitHub Actions workflows
- API endpoints, auth flows, input validation, SQL/file/command execution paths
- Frontend injection surfaces (XSS, unsafe HTML rendering)
- Secrets exposure and insecure configuration

For each finding, include:

- Vulnerability type and severity (CVSS when available)
- Affected file(s) and exact code locations
- Known CVE ID(s) if available (or state when no public CVE is assigned)
- Exploitability analysis in this codebase
- Business impact

### 2) Validate each finding before issue creation

For each vulnerability candidate, verify confidence by:

- Cross-checking with authoritative sources (e.g., GitHub Advisory Database, NVD, vendor advisories)
- Confirming the vulnerable version/range used in this repo
- Rejecting false positives explicitly

Only create issues for validated findings.

### 3) Create one issue per validated vulnerability

Use GitHub MCP issue creation tools to open an issue for each vulnerability.

- Title format: `[Security][<severity>] <short vulnerability name> in <component>`
- Labels (if available): `security`, `vulnerability`, language/ecosystem label, and severity label
- Assignee: `copilot`

### 4) Issue body format (mandatory)

Use this template verbatim for each issue:

```markdown
## Summary
Concise description of the vulnerability and why it matters.

## Classification
- **Severity:** <Critical/High/Medium/Low>
- **CVE:** <CVE-ID(s) or "No public CVE assigned">
- **CWEs:** <CWE list>
- **CVSS:** <score/vector if known>

## Affected Scope
- **Component:** <api/frontend/ci/etc>
- **Files:**
  - `path/to/file.ext` (lines X-Y)
- **Affected versions:** <exact versions/ranges>

## Evidence
- Vulnerable code snippet(s)
- Dependency/advisory evidence with links
- Reproduction or attack path specific to this repository

## Impact Analysis
- What can an attacker do?
- Preconditions
- Data/system impact

## Remediation Plan
1. Exact code/dependency changes required
2. Safe alternative patterns/libraries
3. Backward-compatibility notes
4. Rollout considerations

## Acceptance Criteria
- [ ] Vulnerable code path removed or secured
- [ ] Dependency upgraded to non-vulnerable version
- [ ] Existing tests pass
- [ ] New/updated security regression tests added
- [ ] Build/lint/test commands pass

## Validation Steps for Copilot Coding Agent
1. Commands to run
2. Expected outputs
3. Negative tests (attempted exploit should fail)

## References
- Advisory/CVE links
- Relevant OWASP/CWE documentation
```

## Final Output Requirements

After creating issues, provide:

1. A vulnerability summary table (severity, CVE, component, issue URL)
2. Count of issues created by severity
3. Any high-confidence findings intentionally not filed (with reason)

If **no validated vulnerabilities** are found, explicitly report that and do **not** create placeholder issues.
