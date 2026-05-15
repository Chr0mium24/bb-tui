# bb-tui

CLI for CUHK(SZ) Blackboard Learn.

## Install

```bash
npm install -g .
```

## Setup

1. Login Blackboard in your browser and open DevTools → Application → Cookies.
2. Copy the full `Cookie` header string.
3. Run init:

```bash
bb-tui init --cookie "JSESSIONID=xxx; _gu=xxx; ..." --lang zh
```

## Usage

```bash
bb-tui courses              # list all courses
bb-tui announcements <id> # show announcements
bb-tui assignments <id>   # show assignments
bb-tui grades <id>          # show grades
bb-tui materials <id>       # show tree of materials
bb-tui materials <id> --download <content-id>  # download file
```

Global options:

- `--json`: output raw JSON instead of table/tree.

## Architecture

```
src/
  core/       config, i18n, api, types, output
  commands/   init, courses, announcements, assignments, grades, materials
```
