from __future__ import annotations
import argparse
import csv
import random
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent
DRILLS = ROOT / "gym" / "drills"
NORMAL_DRILLS = DRILLS / "normal"
ADVANCED_DRILLS = DRILLS / "advanced"
SESSIONS = ROOT / "sessions"
LOG = ROOT / "progress.csv"

def drill_files(mode="normal"):
    if mode == "normal":
        folder = NORMAL_DRILLS
    elif mode == "advanced":
        folder = ADVANCED_DRILLS
    elif mode == "all":
        folder = DRILLS
    else:
        raise SystemExit(f"Unknown mode: {mode}")
    return sorted(folder.glob("*.py"))

def cmd_list(args):
    for p in drill_files(args.mode):
        print(p.stem)

def cmd_pick(args):
    drills = drill_files(args.mode)
    if args.seed is not None:
        random.seed(args.seed)
    chosen = random.sample(drills, min(args.count, len(drills)))
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    session = SESSIONS / stamp
    session.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(chosen, 1):
        dst = session / f"{i:02d}_{src.name}"
        shutil.copy2(src, dst)
    print(f"Session: {session.relative_to(ROOT)}")
    for p in sorted(session.glob("*.py")):
        print(f"  python {p.relative_to(ROOT)}")
    print("\nImplement the TODOs from memory. Each file contains its own tests.")

def cmd_log(args):
    session = ROOT / args.session
    if not session.exists():
        raise SystemExit(f"Session not found: {session}")
    seconds = input("Total seconds (optional): ").strip()
    notes = input("Misses / notes (optional): ").strip()
    exists = LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.writer(f)
        if not exists:
            w.writerow(["timestamp", "session", "seconds", "notes"])
        w.writerow([datetime.now().isoformat(timespec="seconds"), args.session, seconds, notes])
    print("Logged.")

def cmd_stats(_):
    if not LOG.exists():
        print("No sessions logged yet.")
        return
    with LOG.open() as f:
        rows = list(csv.DictReader(f))
    print(f"Logged sessions: {len(rows)}")
    timed = [float(r["seconds"]) for r in rows if r["seconds"]]
    if timed:
        print(f"Latest timed session: {timed[-1]:.0f}s")
        print(f"Best timed session:   {min(timed):.0f}s")
    print("\nRecent:")
    for r in rows[-8:]:
        print(f'{r["timestamp"]}  {r["session"]}  {r["seconds"] or "-"}s  {r["notes"]}')

def cmd_reset(_):
    if LOG.exists():
        LOG.unlink()
    print("Progress log reset.")

def main():
    p = argparse.ArgumentParser(prog="gym", description="LeetCode template gym")
    sub = p.add_subparsers(required=True)
    x = sub.add_parser("list", help="List drills by mode")
    x.add_argument("--mode", choices=["normal", "advanced", "all"], default="normal")
    x.set_defaults(fn=cmd_list)
    x = sub.add_parser("pick", help="Create a session folder from drills")
    x.add_argument("count", nargs="?", type=int, default=5)
    x.add_argument("--seed", type=int)
    x.add_argument("--mode", choices=["normal", "advanced", "all"], default="normal",
                   help="Select which drill pool to sample from")
    x.set_defaults(fn=cmd_pick)
    x = sub.add_parser("log"); x.add_argument("session"); x.set_defaults(fn=cmd_log)
    x = sub.add_parser("stats"); x.set_defaults(fn=cmd_stats)
    x = sub.add_parser("reset-stats"); x.set_defaults(fn=cmd_reset)
    a = p.parse_args()
    a.fn(a)

if __name__ == "__main__":
    main()
