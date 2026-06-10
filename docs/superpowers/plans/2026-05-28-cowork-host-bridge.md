# Cowork ⇄ Host Action Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Cowork human-equivalent host reach — fetch/read email attachments, file documents anywhere, draft signed-with-logo replies + attachments, and (only on explicit instruction) send — via a host daemon it drives through the TITRIN mount.

**Architecture:** A stdlib-only host daemon (`TAS-Host-Bridge.py`) watches `TITRIN/_bridge/requests/`, claims each request atomically, dispatches to a *whitelisted* action handler that shells out to the proven `TAS-Gmail-Downloader`/`TAS-Gmail-Composer`/`TAS-Project-Filer` tools (which hold `~/.tas` creds), writes a response + staged files back onto the mount, cleans up, and heartbeats. Cowork (sandbox) communicates only via files on the mount. Creds never cross the boundary.

**Tech Stack:** Python 3.14 (host `…\AppData\Local\Python\bin\python.exe`), stdlib only (`argparse`, `json`, `subprocess`, `pathlib`, `shutil`, `unittest`). Autostart via Windows Task Scheduler. Reuses existing TAS Gmail tools + `tas_gmail_auth.py`.

**Spec:** `tas-hub/docs/superpowers/specs/2026-05-28-cowork-host-bridge-design.md`

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `Claude/TAS - Tools/TAS-Host-Bridge.py` | Daemon: protocol core (claim/dispatch/respond/cleanup/heartbeat) + action handlers | **Create** |
| `Claude/TAS - Tools/test_host_bridge.py` | stdlib `unittest` for the protocol core (fake handlers; no network) | **Create** |
| `Claude/TAS - Tools/TAS-Gmail-Composer.py` | add a gated `send` subcommand; switch `--signature` to inject the exact V3 HTML | **Modify** |
| `Claude/TAS - Tools/system_health.py` | add bridge liveness + stuck-request check | **Modify** |
| `TAS - Branding & Templates/Email Signoff/signature-v3.html` | exact V3 sign-off HTML extracted from a sent email | **Create** |
| `Claude/TAS - Tools/install-bridge-task.ps1` | register the autostart Task Scheduler job | **Create** |
| `.gitignore` | ignore `_bridge/` | **Modify** |

All paths are under `C:\Users\Tish\Desktop\TITRIN\`. The host interpreter is `C:\Users\Tish\AppData\Local\Python\bin\python.exe` (referred to below as `$PY`).

**Convention note (from `tas_gmail_auth.py`):** TAS tools print one JSON object to **stdout**, status to **stderr**, and use `--creds-dir` defaulting to `~/.tas/<service>` (an anti-leak guard in `resolve_creds_dir` redirects any non-`~/.tas` path back). The bridge inherits this by shelling out — it never touches creds directly.

---

## Task 1: Protocol core + unit tests (TDD)

The heart of the system: pure filesystem/logic, fully testable without network. Handlers are **injected** so tests use fakes.

**Files:**
- Create: `Claude/TAS - Tools/TAS-Host-Bridge.py`
- Test: `Claude/TAS - Tools/test_host_bridge.py`

- [ ] **Step 1: Write the failing tests**

```python
# test_host_bridge.py
# -*- coding: utf-8 -*-
"""Unit tests for the TAS-Host-Bridge protocol core. stdlib unittest, no network.
Run: & $PY "Claude/TAS - Tools/test_host_bridge.py" -v
"""
import json, time, unittest, tempfile, importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "tas_host_bridge", str(Path(__file__).with_name("TAS-Host-Bridge.py")))
bridge = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(bridge)


def _write_request(b, rid, obj, ready=True):
    (b / "requests").mkdir(parents=True, exist_ok=True)
    (b / "requests" / f"{rid}.json").write_text(json.dumps(obj), encoding="utf-8")
    if ready:
        (b / "requests" / f"{rid}.ready").write_text("", encoding="utf-8")


class ProtocolCore(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.b = Path(self.tmp.name)
        bridge.ensure_layout(self.b)

    def tearDown(self):
        self.tmp.cleanup()

    def test_find_ready_requires_marker(self):
        _write_request(self.b, "r1", {"action": "x"}, ready=False)
        self.assertEqual(bridge.find_ready(self.b), [])
        (self.b / "requests" / "r1.ready").write_text("", encoding="utf-8")
        self.assertEqual(bridge.find_ready(self.b), ["r1"])

    def test_claim_moves_and_clears_marker(self):
        _write_request(self.b, "r2", {"action": "x"})
        dst = bridge.claim(self.b, "r2")
        self.assertIsNotNone(dst)
        self.assertTrue((self.b / "processing" / "r2.json").exists())
        self.assertFalse((self.b / "requests" / "r2.ready").exists())
        self.assertFalse((self.b / "requests" / "r2.json").exists())

    def test_unknown_action_errors(self):
        _write_request(self.b, "r3", {"action": "nope.nope"})
        bridge.claim(self.b, "r3")
        resp = bridge.process_one(self.b, "r3", {})
        self.assertFalse(resp["ok"])
        self.assertIn("unknown action", resp["error"])
        self.assertTrue((self.b / "responses" / "r3.json").exists())
        self.assertFalse((self.b / "processing" / "r3.json").exists())

    def test_handler_runs_and_writes_files(self):
        def fake(params, staging):
            staging.mkdir(parents=True, exist_ok=True)
            (staging / "out.txt").write_text("hi", encoding="utf-8")
            return {"result": {"echo": params.get("msg")}, "files": ["x"]}
        _write_request(self.b, "r4", {"action": "t.echo", "params": {"msg": "yo"}})
        bridge.claim(self.b, "r4")
        resp = bridge.process_one(self.b, "r4", {"t.echo": fake})
        self.assertTrue(resp["ok"])
        self.assertEqual(resp["result"]["echo"], "yo")
        self.assertTrue((self.b / "staging" / "r4" / "out.txt").exists())

    def test_handler_exception_becomes_error(self):
        def boom(params, staging):
            raise RuntimeError("kaboom")
        _write_request(self.b, "r5", {"action": "t.boom"})
        bridge.claim(self.b, "r5")
        resp = bridge.process_one(self.b, "r5", {"t.boom": boom})
        self.assertFalse(resp["ok"])
        self.assertIn("kaboom", resp["error"])

    def test_bad_json_becomes_error(self):
        (self.b / "processing").mkdir(parents=True, exist_ok=True)
        (self.b / "processing" / "r6.json").write_text("{not json", encoding="utf-8")
        resp = bridge.process_one(self.b, "r6", {})
        self.assertFalse(resp["ok"])
        self.assertTrue((self.b / "responses" / "r6.json").exists())

    def test_response_is_atomic_no_tmp_left(self):
        _write_request(self.b, "r7", {"action": "nope"})
        bridge.claim(self.b, "r7")
        bridge.process_one(self.b, "r7", {})
        leftovers = list((self.b / "responses").glob("*.tmp"))
        self.assertEqual(leftovers, [])

    def test_run_once_processes_all_ready(self):
        for i in range(3):
            _write_request(self.b, f"m{i}", {"action": "nope"})
        out = bridge.run_once(self.b, {})
        self.assertEqual(out["processed"], 3)

    def test_cleanup_removes_old_keeps_new(self):
        old = self.b / "staging" / "old"; old.mkdir(parents=True)
        new = self.b / "staging" / "new"; new.mkdir(parents=True)
        old_resp = self.b / "responses" / "old.json"; old_resp.write_text("{}", encoding="utf-8")
        past = time.time() - 49 * 3600
        import os
        os.utime(old, (past, past)); os.utime(old_resp, (past, past))
        bridge.cleanup(self.b, max_age_hours=48)
        self.assertFalse(old.exists())
        self.assertFalse(old_resp.exists())
        self.assertTrue(new.exists())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail (module missing)**

Run: `& "C:\Users\Tish\AppData\Local\Python\bin\python.exe" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\test_host_bridge.py" -v`
Expected: FAIL — `TAS-Host-Bridge.py` does not exist / import error.

- [ ] **Step 3: Write the protocol core (no handlers yet — empty registry)**

```python
# TAS-Host-Bridge.py
# -*- coding: utf-8 -*-
"""TAS-Host-Bridge — HOST-side action executor that Cowork drives via the TITRIN mount.

Cowork (sandbox) writes _bridge/requests/<id>.json + <id>.ready; this daemon (host,
with ~/.tas creds + host python) claims it, runs a WHITELISTED action by shelling out
to the proven TAS Gmail/Filer tools, writes _bridge/responses/<id>.json + staged files
back onto the mount, cleans up, and heartbeats. No creds or ports cross the boundary.

Modes:  watch  (daemon, ~2s poll)  |  run-once  (drain queue + exit)  |  status
HOST-ONLY: needs ~/.tas + host python; must never run in the Cowork sandbox.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
TITRIN_ROOT = TOOLS_DIR.parents[1]                      # Claude/TAS - Tools/ -> Claude/ -> TITRIN/
PY = Path(sys.executable)
DOWNLOADER = TOOLS_DIR / "TAS-Gmail-Downloader.py"
COMPOSER = TOOLS_DIR / "TAS-Gmail-Composer.py"
PROJECT_FILER = TOOLS_DIR / "TAS-Project-Filer.py"
CALENDAR_SYNC = TOOLS_DIR / "TAS-Calendar-Sync.py"
DEFAULT_BRIDGE = TITRIN_ROOT / "_bridge"
HEARTBEAT = "bridge.alive"
SUBDIRS = ("requests", "processing", "responses", "staging", "logs")
POLL_SECONDS = 2
CLEANUP_AGE_HOURS = 48


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_layout(bridge: Path) -> None:
    for d in SUBDIRS:
        (bridge / d).mkdir(parents=True, exist_ok=True)


def log_line(bridge: Path, msg: str) -> None:
    try:
        (bridge / "logs").mkdir(parents=True, exist_ok=True)
        day = datetime.now().strftime("%Y-%m-%d")
        with (bridge / "logs" / f"bridge-{day}.log").open("a", encoding="utf-8") as fh:
            fh.write(f"{now_iso()} | {msg}\n")
    except OSError:
        pass


def mount_rel(p) -> str:
    """Return a TITRIN-relative, forward-slash path so Cowork can read it on the mount."""
    try:
        return str(Path(p).resolve().relative_to(TITRIN_ROOT.resolve())).replace("\\", "/")
    except (ValueError, OSError):
        return str(p)


def find_ready(bridge: Path) -> list:
    req = bridge / "requests"
    if not req.exists():
        return []
    ids = []
    for ready in req.glob("*.ready"):
        rid = ready.stem
        if (req / f"{rid}.json").exists():
            ids.append(rid)
    return sorted(ids)


def claim(bridge: Path, rid: str):
    """Atomically move requests/<id>.json -> processing/ and drop the .ready marker."""
    src = bridge / "requests" / f"{rid}.json"
    dst = bridge / "processing" / f"{rid}.json"
    try:
        (bridge / "processing").mkdir(parents=True, exist_ok=True)
        os.replace(src, dst)
    except OSError:
        return None
    (bridge / "requests" / f"{rid}.ready").unlink(missing_ok=True)
    return dst


def write_response(bridge: Path, rid: str, resp: dict) -> None:
    (bridge / "responses").mkdir(parents=True, exist_ok=True)
    dst = bridge / "responses" / f"{rid}.json"
    tmp = dst.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(resp, indent=2, default=str), encoding="utf-8")
    os.replace(tmp, dst)                                # atomic so Cowork never reads a partial


def process_one(bridge: Path, rid: str, actions: dict) -> dict:
    proc = bridge / "processing" / f"{rid}.json"
    started = now_iso()
    try:
        req = json.loads(proc.read_text(encoding="utf-8"))
    except Exception as exc:                            # noqa: BLE001 — any parse failure → error response
        resp = {"v": 1, "id": rid, "ok": False, "error": f"unreadable request: {exc}",
                "files": [], "startedAt": started, "finishedAt": now_iso()}
        write_response(bridge, rid, resp)
        proc.unlink(missing_ok=True)
        return resp

    action = req.get("action")
    params = req.get("params") or {}
    resp = {"v": 1, "id": rid, "action": action, "requestedBy": req.get("requestedBy"),
            "startedAt": started}
    handler = actions.get(action)
    if handler is None:
        resp.update({"ok": False, "error": f"unknown action: {action}", "files": []})
    else:
        try:
            out = handler(params, bridge / "staging" / rid)
            resp.update({"ok": True, "result": out.get("result"),
                         "files": out.get("files", []), "error": None})
        except Exception as exc:                        # noqa: BLE001 — never let one bad request crash the daemon
            resp.update({"ok": False, "error": f"{type(exc).__name__}: {exc}", "files": []})
            log_line(bridge, f"ERROR {action} {rid}: {traceback.format_exc()[-600:]}")
    resp["finishedAt"] = now_iso()
    write_response(bridge, rid, resp)
    proc.unlink(missing_ok=True)
    log_line(bridge, f"{action} {rid} ok={resp.get('ok')} "
                     f"files={len(resp.get('files') or [])} by={req.get('requestedBy')}")
    return resp


def run_once(bridge: Path, actions: dict) -> dict:
    ensure_layout(bridge)
    results = []
    for rid in find_ready(bridge):
        if claim(bridge, rid):
            results.append(process_one(bridge, rid, actions))
    return {"processed": len(results), "results": results}


def heartbeat(bridge: Path) -> None:
    try:
        (bridge / HEARTBEAT).write_text(now_iso(), encoding="utf-8")
    except OSError:
        pass


def cleanup(bridge: Path, max_age_hours: int = CLEANUP_AGE_HOURS) -> None:
    cutoff = time.time() - max_age_hours * 3600
    for sub in ("responses", "staging"):
        d = bridge / sub
        if not d.exists():
            continue
        for child in d.iterdir():
            try:
                if child.stat().st_mtime < cutoff:
                    shutil.rmtree(child, ignore_errors=True) if child.is_dir() else child.unlink(missing_ok=True)
            except OSError:
                pass


def build_actions() -> dict:
    return {}                                           # handlers added in Tasks 2-5


def watch(bridge: Path, interval: int = POLL_SECONDS) -> None:
    ensure_layout(bridge)
    log_line(bridge, "bridge watch started")
    last_cleanup = 0.0
    actions = build_actions()
    while True:
        heartbeat(bridge)
        try:
            run_once(bridge, actions)
        except Exception as exc:                        # noqa: BLE001
            log_line(bridge, f"loop error: {exc}")
        if time.time() - last_cleanup > 3600:
            cleanup(bridge)
            last_cleanup = time.time()
        time.sleep(interval)


def main() -> int:
    ap = argparse.ArgumentParser(prog="TAS-Host-Bridge")
    ap.add_argument("--bridge-dir", default=str(DEFAULT_BRIDGE))
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("watch", help="Run the daemon (poll + dispatch + cleanup + heartbeat)")
    sub.add_parser("run-once", help="Process all pending requests once, then exit")
    sub.add_parser("status", help="Print heartbeat + pending count")
    args = ap.parse_args()
    bridge = Path(args.bridge_dir).expanduser()
    if not bridge.is_absolute():
        bridge = TITRIN_ROOT / bridge
    if args.cmd == "watch":
        watch(bridge)
    elif args.cmd == "run-once":
        print(json.dumps(run_once(bridge, build_actions()), indent=2, default=str))
    elif args.cmd == "status":
        hb = bridge / HEARTBEAT
        pending = len(list((bridge / "requests").glob("*.ready"))) if (bridge / "requests").exists() else 0
        print(json.dumps({"bridgeDir": str(bridge),
                          "heartbeat": hb.read_text(encoding="utf-8").strip() if hb.exists() else None,
                          "pendingReady": pending}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `& "C:\Users\Tish\AppData\Local\Python\bin\python.exe" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\test_host_bridge.py" -v`
Expected: all tests PASS.

- [ ] **Step 5: Commit** (TITRIN auto-backs-up; commit locally, do not push)

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/TAS-Host-Bridge.py" "Claude/TAS - Tools/test_host_bridge.py"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(bridge): host-side action bridge protocol core + tests"
```

---

## Task 2: Inbound Gmail handlers (harvest / download / drive)

**Files:** Modify `Claude/TAS - Tools/TAS-Host-Bridge.py` (add handlers + register).

- [ ] **Step 1: Add a subprocess helper + the three inbound handlers** (insert above `build_actions`)

```python
def run_tool(argv: list, timeout: int = 600) -> dict:
    """Run a TAS tool and parse its single JSON stdout object (last line)."""
    proc = subprocess.run([str(PY)] + [str(a) for a in argv],
                          capture_output=True, text=True, timeout=timeout)
    out = (proc.stdout or "").strip()
    if out:
        try:
            return json.loads(out.splitlines()[-1])
        except json.JSONDecodeError:
            return {"ok": proc.returncode == 0, "raw": out[-2000:]}
    return {"ok": proc.returncode == 0, "error": (proc.stderr or "").strip()[-1000:]}


def h_harvest(params: dict, staging: Path) -> dict:
    staging.mkdir(parents=True, exist_ok=True)
    out_dir = params.get("outDir") or str(staging)
    argv = [DOWNLOADER, "harvest", "--query", params["query"], "--out-dir", out_dir]
    if params.get("max"):
        argv += ["--max", str(params["max"])]
    if params.get("bodies") is False:
        argv += ["--no-bodies"]
    if params.get("drive") is False:
        argv += ["--no-drive"]
    data = run_tool(argv)
    files = [mount_rel(x["path"]) for x in data.get("attachmentsDownloaded", []) if x.get("path")]
    files += [mount_rel(x["path"]) for x in data.get("driveFilesDownloaded", []) if x.get("path")]
    summary = {k: (len(data[k]) if isinstance(data.get(k), list) else data.get(k))
               for k in ("messagesProcessed", "attachmentsDownloaded", "duplicatesSkipped",
                         "driveFilesDownloaded", "errors") if k in data}
    return {"result": summary, "files": files}


def h_download(params: dict, staging: Path) -> dict:
    argv = [DOWNLOADER, "download", "--message-id", params["messageId"],
            "--attachment-id", params["attachmentId"], "--filename", params["filename"]]
    if params.get("inline"):
        return {"result": run_tool(argv + ["--stdout"]), "files": []}   # base64 in result
    staging.mkdir(parents=True, exist_ok=True)
    data = run_tool(argv + ["--out-dir", str(staging)])
    path = (data.get("downloaded") or {}).get("path")
    return {"result": data.get("downloaded"), "files": [mount_rel(path)] if path else []}


def h_drive(params: dict, staging: Path) -> dict:
    staging.mkdir(parents=True, exist_ok=True)
    data = run_tool([DOWNLOADER, "drive", "--file-id", params["fileId"], "--out-dir", str(staging)])
    path = (data.get("downloaded") or {}).get("path")
    return {"result": data.get("downloaded"), "files": [mount_rel(path)] if path else []}
```

- [ ] **Step 2: Register them** — replace `build_actions` body:

```python
def build_actions() -> dict:
    return {
        "gmail.harvest": h_harvest,
        "gmail.download": h_download,
        "gmail.drive": h_drive,
    }
```

- [ ] **Step 3: Re-run unit tests (regression — core still green)**

Run: `& "$PY" "…/test_host_bridge.py" -v` → all PASS (handlers don't affect core tests).

- [ ] **Step 4: Integration test on host (real auth) — quick peek via `download --inline`**

First get a real message+attachment id:
```
& "$PY" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Gmail-Downloader.py" search --query "has:attachment newer_than:30d filename:pdf" --max 3
```
Then craft a `gmail.download` request (inline) and drain it:
```powershell
$b = "C:\Users\Tish\Desktop\TITRIN\_bridge"
New-Item -ItemType Directory -Force "$b\requests" | Out-Null
$req = @{ v=1; id="itest-dl"; action="gmail.download"; params=@{ messageId="<M>"; attachmentId="<A>"; filename="peek.pdf"; inline=$true }; requestedBy="itest"; ts="2026-05-28T00:00:00-07:00" } | ConvertTo-Json
Set-Content "$b\requests\itest-dl.json" $req -Encoding utf8
Set-Content "$b\requests\itest-dl.ready" "" -Encoding utf8
& "$PY" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Host-Bridge.py" run-once
Get-Content "$b\responses\itest-dl.json"
```
Expected: response `ok:true` with `result.base64` present, `files: []`. (Confirms creds + Downloader + protocol end-to-end on the host.)

- [ ] **Step 5: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/TAS-Host-Bridge.py"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(bridge): inbound Gmail handlers (harvest/download/drive)"
```

---

## Task 3: Composer `send` subcommand (gated) + scope verification

**Files:** Modify `Claude/TAS - Tools/TAS-Gmail-Composer.py`.

- [ ] **Step 1: Verify the existing token can send (no re-auth expected)**

```powershell
& "$PY" -c "import json,sys; d=json.load(open(r'C:\Users\Tish\.tas\gmail\token.json')); print('scopes:', d.get('scopes'))"
```
Expected: list includes `https://www.googleapis.com/auth/gmail.modify`. Per Gmail API, `drafts.send`/`messages.send` are authorized by `gmail.modify` → **no re-consent needed**. If `gmail.modify` is absent, STOP and flag a one-time re-auth before enabling send.

- [ ] **Step 2: Add the `send` subcommand to the Composer** — add this handler near `cmd_draft`:

```python
def cmd_send(args: argparse.Namespace) -> None:
    """Send an EXISTING draft by id. Gated by --confirm. Used only on Tish's explicit instruction."""
    if not args.confirm:
        die("send requires --confirm (guards against accidental/automated sends)", code=2)
    creds = get_credentials(Path(args.creds_dir).expanduser().resolve())
    gmail, _, _ = build_services(creds)
    sent = gmail.users().drafts().send(userId="me", body={"id": args.draft_id}).execute()
    write_log_entry(TOOL_NAME, "send", f"draftId={args.draft_id}",
                    f"messageId={sent.get('id')} threadId={sent.get('threadId')}")
    emit({"ok": True, "action": "send", "draftId": args.draft_id,
          "messageId": sent.get("id"), "threadId": sent.get("threadId")})
```

- [ ] **Step 3: Register the subcommand** — in `main()`, after the `draft` parser block:

```python
    psd = sub.add_parser("send", help="Send an EXISTING draft by id (gated by --confirm; never auto-invoked)")
    psd.add_argument("--draft-id", required=True)
    psd.add_argument("--confirm", action="store_true",
                     help="Required. Without it, send refuses. Set only on explicit instruction.")
    add_creds_arg(psd)
    psd.set_defaults(func=cmd_send)
```

- [ ] **Step 4: Verify the guard fails closed**

```
& "$PY" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Gmail-Composer.py" send --draft-id fake
```
Expected: JSON `ok:false`, error mentions `--confirm`, exit code 2. (No send attempted.)

- [ ] **Step 5: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/TAS-Gmail-Composer.py"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(composer): gated send subcommand (--confirm required)"
```

---

## Task 4: Exact V3 signature template + Composer wiring

**Files:** Create `TAS - Branding & Templates/Email Signoff/signature-v3.html`; Modify `Claude/TAS - Tools/TAS-Gmail-Composer.py`.

- [ ] **Step 1: Dump a recent sent email's HTML to extract the real V3 sign-off** (one-off helper, run inline)

```powershell
& "$PY" - <<'PY'
import sys; sys.path.insert(0, r"C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools")
from pathlib import Path
from tas_gmail_auth import get_credentials, build_services
import base64
creds = get_credentials(Path.home()/".tas"/"gmail")
gmail,_,_ = build_services(creds)
ids = gmail.users().messages().list(userId="me", q="in:sent newer_than:60d", maxResults=10).execute().get("messages",[])
def html_of(mid):
    m = gmail.users().messages().get(userId="me", id=mid, format="full").execute()
    def walk(p):
        if p.get("mimeType")=="text/html" and p.get("body",{}).get("data"):
            return base64.urlsafe_b64decode(p["body"]["data"]+"==").decode("utf-8","replace")
        for s in p.get("parts",[]) or []:
            r=walk(s)
            if r: return r
        return ""
    return walk(m.get("payload",{}))
for r in ids:
    h = html_of(r["id"])
    if "titrin" in h.lower() or "Titina" in h:
        Path(r"C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\_sig-dump.html").write_text(h, encoding="utf-8")
        print("dumped from", r["id"], "len", len(h)); break
PY
```
Expected: writes `_sig-dump.html`. Open it, locate the signature block (the `<div>`/`<table>` containing the logo `<img>`, the "Tish Titina / Principal / P.Ag., MSc / C: …" lines, and the italic confidentiality footer).

- [ ] **Step 2: Save the signature block as the template** — create `TAS - Branding & Templates/Email Signoff/signature-v3.html` containing exactly that block (the `<img>` may point at its existing `googleusercontent` URL — that renders for recipients just like Tish's manual sends; keep it). Delete `_sig-dump.html` afterward.

- [ ] **Step 3: Wire the Composer to inject the template when present** — replace `_body_html_with_signature` and the `DEFAULT_SIGNATURE` resolution:

```python
SIGNATURE_HTML_TEMPLATE = (
    ROOT / "TAS - Branding & Templates" / "Email Signoff" / "signature-v3.html"
)

def _body_html_with_signature(body_text: str, cid: str) -> str:
    """Body as HTML followed by Tish's exact V3 sign-off. Prefer the extracted
    signature-v3.html (matches his manual sends byte-for-byte); fall back to the
    inlined V3 jpg if the template is absent."""
    escaped = html_lib.escape(body_text).replace("\r\n", "\n").replace("\n", "<br>\n")
    body_div = (
        '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;'
        f'color:#212a33;line-height:1.4">{escaped}<br><br>'
    )
    if SIGNATURE_HTML_TEMPLATE.exists():
        return body_div + SIGNATURE_HTML_TEMPLATE.read_text(encoding="utf-8") + "</div>"
    return (body_div + f'<img src="cid:{cid}" alt="Titrin AgriSoil Solutions Ltd." '
            'style="max-width:520px;height:auto"></div>')
```
Keep the existing `_attach_inline_image`/`MIMEMultipart("related")` path so the cid fallback still works when the template is missing. (If the template uses a hosted image URL, the inline cid image is harmless/unused.)

- [ ] **Step 4: Integration test — draft to self, eyeball the signature, then delete**

```
& "$PY" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Gmail-Composer.py" draft --to "titrinsolutions@gmail.com" --subject "BRIDGE TEST — signature" --body "Test body line one.`nLine two." --signature
```
Expected: `ok:true`, `signatureInlined:true`, a `draftId`. **Manually open the draft in Gmail** → confirm logo + contact + confidentiality footer render exactly like a normal send. Then delete the test draft (Gmail UI, or `gmail.send` is NOT used here).

- [ ] **Step 5: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/TAS-Gmail-Composer.py" "TAS - Branding & Templates/Email Signoff/signature-v3.html"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(composer): inject exact V3 sign-off HTML (logo+contact+footer)"
```

---

## Task 5: Outbound + utility handlers (draft / send / file.place / tool.run)

**Files:** Modify `Claude/TAS - Tools/TAS-Host-Bridge.py`.

- [ ] **Step 1: Add the handlers** (above `build_actions`)

```python
def h_draft(params: dict, staging: Path) -> dict:
    argv = [COMPOSER, "draft", "--to", params["to"], "--subject", params["subject"]]
    if params.get("bodyFile"):
        argv += ["--body-file", params["bodyFile"]]
    else:
        argv += ["--body", params.get("body", "")]
    for att in params.get("attach") or []:
        argv += ["--attach", att]
    if params.get("threadId"):
        argv += ["--thread-id", params["threadId"]]
    if params.get("cc"):
        argv += ["--cc", params["cc"]]
    if params.get("bcc"):
        argv += ["--bcc", params["bcc"]]
    if params.get("signature", True):                  # signed-by-default
        argv += ["--signature"]
    return {"result": run_tool(argv), "files": []}


def h_send(params: dict, staging: Path) -> dict:
    if params.get("confirm") is not True:
        raise ValueError("gmail.send requires confirm:true — explicit instruction only")
    if not params.get("draftId"):
        raise ValueError("gmail.send requires draftId")
    return {"result": run_tool([COMPOSER, "send", "--draft-id", params["draftId"], "--confirm"]),
            "files": []}


def h_file_place(params: dict, staging: Path) -> dict:
    src = Path(params["srcMountPath"]).expanduser()
    if not src.is_absolute():
        src = TITRIN_ROOT / params["srcMountPath"]
    src = src.resolve()
    src.relative_to(TITRIN_ROOT.resolve())              # raises ValueError if src is outside the mount
    if not src.is_file():
        raise FileNotFoundError(f"src not found: {src}")
    dest = Path(params["destHostPath"]).expanduser().resolve()
    windir = Path(os.environ.get("WINDIR", r"C:\Windows")).resolve()
    try:
        dest.relative_to(windir)
        raise PermissionError(f"refusing to write under {windir}")
    except ValueError:
        pass
    if dest.exists() and not params.get("overwrite"):
        raise FileExistsError(f"dest exists (set overwrite:true to replace): {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return {"result": {"placed": str(dest)}, "files": []}


TOOL_WHITELIST = {"project-filer": PROJECT_FILER, "calendar-sync": CALENDAR_SYNC}

def h_tool_run(params: dict, staging: Path) -> dict:
    tool = TOOL_WHITELIST.get(params.get("tool"))
    if tool is None:
        raise ValueError(f"tool not in whitelist: {params.get('tool')}")
    args = params.get("args") or []
    if not all(isinstance(a, str) for a in args):
        raise ValueError("args must be a list of strings")
    return {"result": run_tool([tool] + args), "files": []}
```

- [ ] **Step 2: Register all actions** — replace `build_actions`:

```python
def build_actions() -> dict:
    return {
        "gmail.harvest": h_harvest,
        "gmail.download": h_download,
        "gmail.drive": h_drive,
        "gmail.draft": h_draft,
        "gmail.send": h_send,
        "file.place": h_file_place,
        "tool.run": h_tool_run,
    }
```

- [ ] **Step 3: Add unit tests for the pure handlers** (append to `test_host_bridge.py`)

```python
class PureHandlers(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.b = Path(self.tmp.name)
        bridge.ensure_layout(self.b)
    def tearDown(self):
        self.tmp.cleanup()

    def test_send_requires_confirm(self):
        with self.assertRaises(ValueError):
            bridge.h_send({"draftId": "x"}, self.b / "staging" / "s")

    def test_file_place_rejects_src_outside_mount(self):
        outside = Path(self.tmp.name) / "outside.txt"; outside.write_text("x", encoding="utf-8")
        with self.assertRaises(ValueError):   # not under TITRIN_ROOT
            bridge.h_file_place({"srcMountPath": str(outside), "destHostPath": str(self.b / "d.txt")},
                                self.b / "staging" / "s")

    def test_tool_run_rejects_unlisted(self):
        with self.assertRaises(ValueError):
            bridge.h_tool_run({"tool": "rm-rf", "args": []}, self.b / "staging" / "s")
```
Run: `& "$PY" "…/test_host_bridge.py" -v` → all PASS.

- [ ] **Step 4: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/TAS-Host-Bridge.py" "Claude/TAS - Tools/test_host_bridge.py"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(bridge): outbound + utility handlers (draft/send/file.place/tool.run)"
```

---

## Task 6: `.gitignore` + health check

**Files:** Modify `.gitignore`; Modify `Claude/TAS - Tools/system_health.py`.

- [ ] **Step 1: Ignore the bridge runtime dir** — add under the existing staging block in `.gitignore`:

```
# --- Cowork<->host bridge runtime (requests/responses/staging; client data) ---
_bridge/
```

- [ ] **Step 2: Read `system_health.py`** to match its emit/check pattern before editing.

Run: open `Claude/TAS - Tools/system_health.py`; note how existing checks append status lines (e.g. a list of `(level, message)` or printed lines) and how IN_SANDBOX is detected.

- [ ] **Step 3: Add a bridge health check** — add this function and call it from the main check sequence, following the file's existing append/emit style:

```python
def check_bridge():
    """Bridge liveness + stuck-request check. Returns (level, message).
    Skips quietly in the Cowork sandbox (the daemon is host-only)."""
    from pathlib import Path
    from datetime import datetime
    bridge = Path.home() / "Desktop" / "TITRIN" / "_bridge"
    # In-sandbox HOME differs and the host bridge isn't ours to judge — skip.
    if not (Path.home() / ".tas").exists():
        return ("OK", "bridge: skipped (sandbox)")
    hb = bridge / "bridge.alive"
    if not bridge.exists() or not hb.exists():
        return ("WARN", "bridge: no heartbeat yet (daemon may not have started)")
    try:
        age = (datetime.now() - datetime.fromisoformat(hb.read_text(encoding="utf-8").strip())).total_seconds()
    except Exception:
        return ("WARN", "bridge: heartbeat unreadable")
    if age > 180:
        return ("WARN", f"bridge: heartbeat stale ({int(age)}s) — daemon may be down (TAS-Host-Bridge task)")
    reqs = bridge / "requests"
    stuck = [p for p in reqs.glob("*.ready")] if reqs.exists() else []
    if stuck:
        return ("WARN", f"bridge: {len(stuck)} request(s) pending unprocessed — check the daemon")
    return ("OK", f"bridge: alive ({int(age)}s ago)")
```
Wire its result into the existing health output exactly like the other checks (match the file's pattern — e.g. append to the results list / print the status line).

- [ ] **Step 4: Verify health check runs**

Run: `& "$PY" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\system_health.py"`
Expected: output now contains a `bridge:` line (WARN before the daemon runs; OK after Task 7 starts it).

- [ ] **Step 5: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add .gitignore "Claude/TAS - Tools/system_health.py"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(bridge): gitignore _bridge/ + system_health liveness check"
```

---

## Task 7: Autostart task + end-to-end host smoke test

**Files:** Create `Claude/TAS - Tools/install-bridge-task.ps1`.

- [ ] **Step 1: Write the installer script**

```powershell
# install-bridge-task.ps1 — register TAS-Host-Bridge as a logon daemon (restart on failure).
$py     = "C:\Users\Tish\AppData\Local\Python\bin\python.exe"
$script = "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Host-Bridge.py"
$action = New-ScheduledTaskAction -Execute $py -Argument "`"$script`" watch"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 0)
Register-ScheduledTask -TaskName "TAS-Host-Bridge" -Action $action -Trigger $trigger `
    -Settings $settings -Description "Cowork<->host action bridge daemon (watches TITRIN\_bridge)" -Force
Write-Output "Registered TAS-Host-Bridge. Start now with: Start-ScheduledTask -TaskName TAS-Host-Bridge"
```

- [ ] **Step 2: End-to-end smoke test with `run-once` BEFORE installing the always-on task** — full round trip for harvest:

```powershell
$b = "C:\Users\Tish\Desktop\TITRIN\_bridge"
$req = @{ v=1; id="itest-harvest"; action="gmail.harvest"; params=@{ query="has:attachment newer_than:14d"; max=5 }; requestedBy="itest"; ts="2026-05-28T00:00:00-07:00" } | ConvertTo-Json
New-Item -ItemType Directory -Force "$b\requests" | Out-Null
Set-Content "$b\requests\itest-harvest.json" $req -Encoding utf8
Set-Content "$b\requests\itest-harvest.ready" "" -Encoding utf8
& "C:\Users\Tish\AppData\Local\Python\bin\python.exe" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Host-Bridge.py" run-once
Get-Content "$b\responses\itest-harvest.json"
Get-ChildItem "$b\staging\itest-harvest" -Recurse -ErrorAction SilentlyContinue
```
Expected: response `ok:true`, `files[]` lists mount-relative paths, staged files exist. (`.ready` consumed; `processing/` empty; no `.tmp` in `responses/`.)

- [ ] **Step 3: Register + start the daemon** ⚠️ **GATED — confirm with Tish first** (adding a scheduled task; CLAUDE.md requires asking).

```powershell
& "C:\Users\Tish\AppData\Local\Python\bin\python.exe" -V   # sanity
powershell -ExecutionPolicy Bypass -File "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\install-bridge-task.ps1"
Start-ScheduledTask -TaskName TAS-Host-Bridge
Start-Sleep -Seconds 5
& "C:\Users\Tish\AppData\Local\Python\bin\python.exe" "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\TAS-Host-Bridge.py" status
```
Expected: `status` shows a fresh `heartbeat` timestamp; `system_health.py` now prints `bridge: alive`.

- [ ] **Step 4: Commit**

```
git -C "C:\Users\Tish\Desktop\TITRIN" add "Claude/TAS - Tools/install-bridge-task.ps1"
git -C "C:\Users\Tish\Desktop\TITRIN" commit -m "feat(bridge): autostart task installer + host smoke test green"
```

---

## Task 8: Cowork calling convention (doc snippet, for Task 9 wiring)

**Files:** none yet — this defines the contract the skills will use (implemented in the documentation task #9).

- [ ] **Step 1: Record the canonical Cowork-side snippet** (goes into `gmail-workflow.md` in the docs task):

```python
# Cowork side (sandbox). Mount-relative paths under the selected TITRIN folder.
import json, time, uuid, pathlib
B = pathlib.Path("_bridge")                       # TITRIN/_bridge on the mount
rid = "req-" + uuid.uuid4().hex[:10]
(B / "requests").mkdir(parents=True, exist_ok=True)
(B / "requests" / f"{rid}.json").write_text(json.dumps({
    "v": 1, "id": rid, "action": "gmail.harvest",
    "params": {"query": 'subject:"21700 River Road" has:attachment'},
    "requestedBy": "project-lead", "ts": "—"}), encoding="utf-8")
(B / "requests" / f"{rid}.ready").write_text("", encoding="utf-8")   # marker LAST
resp_path = B / "responses" / f"{rid}.json"
for _ in range(60):                               # poll ~2 min
    if resp_path.exists():
        break
    time.sleep(2)
resp = json.loads(resp_path.read_text(encoding="utf-8"))
# resp["files"] → mount-relative paths to Read/analyze; resp["result"] → summary
```

- [ ] **Step 2: No code/commit here** — this is the interface contract consumed by Task 9.

---

## Task 9: Documentation + skill wiring + stale-fact fixes (maps to roadmap Task #9)

**Files (Modify):** `Claude/memory/gmail-workflow.md`, `reference_tas_scripts_host_only.md`, `automation_and_scheduled_tasks.md`, `ARCHITECTURE.md`, `feedback/feedback_primary_workflow.md`, `feedback_secrets_outside_synced_tree.md` (tas-hub copy), the `email-responder`/`project-lead`/`tas-report-writer` SKILL.md; **Append:** `Claude/CANDIDATE-EDITS.md`. Create a runbook `Claude/memory/workflows/cowork-host-bridge-runbook.md`.

- [ ] **Step 1:** Add a "Host bridge (on-demand)" section to `gmail-workflow.md` with the §Task-8 snippet + the action table; mark it the path for in-Cowork attachment fetch + signed drafts + gated send.
- [ ] **Step 2:** In `reference_tas_scripts_host_only.md` + `automation_and_scheduled_tasks.md`, add `TAS-Host-Bridge.py` (host-only daemon) + the `TAS-Host-Bridge` scheduled task; note signed-drafts + gated-send now flow through it.
- [ ] **Step 3:** Wire `email-responder`/`project-lead`/`tas-report-writer` to stage `gmail.draft` (signature default) via the bridge for client emails instead of the bare MCP.
- [ ] **Step 4:** Fix the stale "Cowork has full host access" claims in `feedback_primary_workflow.md` and the tas-hub `feedback_secrets_outside_synced_tree.md` (Cowork is sandboxed; host reach is via the bridge).
- [ ] **Step 5:** Create the runbook (architecture, action set, how to restart the daemon, how to read logs, troubleshooting). Append an outcome entry to `CANDIDATE-EDITS.md`.
- [ ] **Step 6: Commit** the documentation set.

---

## Task 10: Live Cowork acceptance test (Tish-driven — roadmap Task #8)

Not executable from Claude Code. Hand Tish the exact copy-paste script (the Task-8 snippet, pointed at a real recent thread) to run from a Cowork session, validating all six acceptance steps (pull → analyze → file → draft → signed attachment → gated send). Capture the result.

---

## Self-Review

- **Spec coverage:** protocol (§5)→T1; inbound bytes (§7)→T2; send (§7/§9)→T3; signature fidelity (§8)→T4; outbound + file.place + tool.run (§7)→T5; gitignore + health/self-heal (§9/§10)→T6; autostart (§10) + e2e→T7; Cowork convention (§6)→T8; docs/placement (§13) + stale fixes→T9; Cowork acceptance (§11)→T10. All covered.
- **Placeholders:** none — every code/test step has complete content. The only judgment step (extracting the signature block in T4) has a concrete dumper + a clear "save this block" instruction.
- **Type/signature consistency:** handlers are uniformly `handle(params: dict, staging: Path) -> {"result", "files"}`; `run_once(bridge, actions)` / `process_one(bridge, rid, actions)` signatures match the tests; `build_actions()` keys match the spec action names; `run_tool` used consistently.
- **Gaps fixed inline:** T3 gates send before T5's `h_send` calls it; T4 lands the template before T5 wires drafts; `system_health.py` exact wiring is read-first (T6.2) to avoid a blind edit.

## Execution handoff

Recommended: **Inline execution** (superpowers:executing-plans) in this Claude Code session — the tasks share one module + live host creds (the integration tests need them), so a single context is more reliable than fresh per-task subagents. Task 7.3 (register the scheduled task) and Task 10 (Cowork) are the two human-gated points.
