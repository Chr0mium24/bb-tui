# bb-tui

CLI for **CUHK(SZ) Blackboard Learn**.

A terminal-based client to browse courses, announcements, assignments, grades, and download course materials — without opening the browser.

## Install

### From source

```bash
git clone https://github.com/Chr0mium24/bb-tui.git
cd bb-tui
npm install
npm link        # or: npm install -g .
```

### From npm (when published)

```bash
npm install -g bb-tui
```

## Quick Start

### 1. Get your Cookie

1. Open [https://bb.cuhk.edu.cn](https://bb.cuhk.edu.cn) in browser and log in.
2. Press `F12` → **Network** tab → refresh the page.
3. Click any request (e.g. `tabAction`) → **Headers** → find `cookie:`.
4. Copy the **entire** cookie string.

### 2. Initialize

```bash
bb-tui init --cookie "JSESSIONID=xxx; _gu=xxx; s_session_id=xxx; ..." --lang zh
```

- `--cookie`: your Blackboard session cookie (required)
- `--lang`: `zh` (default) or `en`

Cookie is saved to `~/.bb-tui/config.json`. Re-run `init` anytime to update.

## Commands

### `courses`

List your enrolled courses (not all system courses).

```bash
bb-tui courses
bb-tui courses --json
```

Output:
```
┌──────────┬──────────────────────────────┐
│ ID       │ 名称                          │
├──────────┼──────────────────────────────┤
│ _16592_1 │ DDA3020:Machine Learning_L01 │
│ _16184_1 │ PHY1011:Honours Mechanics_L01│
└──────────┴──────────────────────────────┘
```

### `announcements <course-id>`

```bash
bb-tui announcements _16592_1
bb-tui announcements _16592_1 --json
bb-tui announcements _16592_1 --show-body    # show plain-text body
```

### `assignments <course-id>`

```bash
bb-tui assignments _16592_1
bb-tui assignments _16592_1 --json
```

### `grades <course-id>`

```bash
bb-tui grades _16592_1
bb-tui grades _16592_1 --json
```

### `materials <course-id>`

Browse course materials as a tree:

```bash
bb-tui materials _16592_1
bb-tui materials _16592_1 --json
```

Output:
```
├── [📁 文件夹] Lecture Slides (_468030_1)
│   ├── [📄 文件] Chapter 1 (ch1.pdf) (_468031_1)
│   └── [📄 文件] Chapter 2 (ch2.pdf) (_468032_1)
└── [📁 文件夹] Assignments (_468033_1)
    └── [📄 文件] HW1 (hw1.docx) (_468034_1)
```

**Download a file:**

```bash
bb-tui materials _16592_1 --download _468031_1
```

File saved to `./downloads/<filename>`.

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output raw JSON instead of table / tree |

## FAQ

**Q: Session expired error**

Re-run init with a fresh cookie:
```bash
bb-tui init --cookie "..."
```

**Q: Cookie 从哪复制？**

DevTools → Network → 任意请求 → Request Headers → `cookie:` 整行。

**Q: 下载的文件在哪？**

当前目录下的 `downloads/` 文件夹。

## Architecture

```
src/
  core/
    config.ts     # ~/.bb-tui/config.json
    i18n.ts       # zh / en strings
    api.ts        # fetch wrapper + session expiry detection
    types.ts      # TypeScript interfaces
    output.ts     # table / JSON formatters
  commands/
    init.ts
    courses.ts
    announcements.ts
    assignments.ts
    grades.ts
    materials.ts
```

## License

MIT
