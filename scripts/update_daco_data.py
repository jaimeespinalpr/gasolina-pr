#!/usr/bin/env python3
"""Scrape official DACO gasoline prices and update daco-data.json.

This script is intended to run from GitHub Actions on a schedule. It writes a
versioned JSON file only when DACO's public gasoline block changes.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "daco-data.json"
SOURCE_URL = "https://www.daco.pr.gov/"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"

PRICE_RE = re.compile(
    r'<div class="cus_datos">\s*<label class="cus_lab_one">([0-9.]+)</label>\s*<label class="cus_lab_two">([0-9.]+)</label></div><p[^>]*>\s*(Regular|Premium|Diésel)\s*</p>',
    re.I,
)
DATE_RE = re.compile(r'Actualizado:\s*<span[^>]*>\s*([^<]+?)\s*</span>', re.I)


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_html() -> str:
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")


def parse_snapshot(html: str) -> dict:
    date_match = DATE_RE.search(html)
    page_date = date_match.group(1).strip() if date_match else "Desconocido"

    matches = PRICE_RE.findall(html)
    if len(matches) < 3:
        raise RuntimeError(f"Could not parse DACO price block. Found {len(matches)} matches.")

    ranges = {}
    mid = {}
    for low, high, label in matches[:3]:
        key = {"Regular": "regular", "Premium": "premium", "Diésel": "diesel"}[label]
        low_f = float(low)
        high_f = float(high)
        ranges[key] = {
            "low": low_f,
            "high": high_f,
            "mid": round((low_f + high_f) / 2, 1),
        }
        mid[key] = ranges[key]["mid"]

    return {
        "source_url": SOURCE_URL,
        "official_page_updated_at": page_date,
        "last_scraped_at": now_iso(),
        "prices": ranges,
        "mid": mid,
    }


def load_existing() -> dict | None:
    if not DATA_PATH.exists():
        return None
    try:
        return json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def snapshot_entry(snapshot: dict) -> dict:
    return {
        "scraped_at": snapshot["last_scraped_at"],
        "official_page_updated_at": snapshot["official_page_updated_at"],
        "mid": snapshot["mid"],
    }


def build_seed_history() -> list[dict]:
    # Seed with the current reference series so the dashboard has trend data
    # before the first few scheduled runs have accumulated history.
    return [
        {"scraped_at": "2026-05-08T00:00:00Z", "official_page_updated_at": "seed", "mid": {"regular": 106.5, "premium": 118.5, "diesel": 117.5}},
        {"scraped_at": "2026-05-15T00:00:00Z", "official_page_updated_at": "seed", "mid": {"regular": 108.2, "premium": 120.2, "diesel": 119.2}},
        {"scraped_at": "2026-05-22T00:00:00Z", "official_page_updated_at": "seed", "mid": {"regular": 109.5, "premium": 121.5, "diesel": 122.5}},
    ]


def build_data(snapshot: dict, history: list[dict]) -> dict:
    return {
        "source_url": snapshot["source_url"],
        "official_page_updated_at": snapshot["official_page_updated_at"],
        "last_scraped_at": snapshot["last_scraped_at"],
        "prices": snapshot["prices"],
        "history": history,
    }


def main() -> int:
    html = fetch_html()
    snapshot = parse_snapshot(html)
    existing = load_existing()
    current_entry = snapshot_entry(snapshot)

    if existing is None:
        history = build_seed_history() + [current_entry]
        data = build_data(snapshot, history)
        DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"status": "created", "path": str(DATA_PATH), "official_page_updated_at": snapshot["official_page_updated_at"], "last_scraped_at": snapshot["last_scraped_at"]}, ensure_ascii=False))
        return 0

    existing_prices = existing.get("prices") or {}
    existing_history = existing.get("history") or []
    last_history = existing_history[-1] if existing_history else None
    current_prices = snapshot["prices"]

    prices_changed = existing_prices != current_prices
    page_date_changed = existing.get("official_page_updated_at") != snapshot["official_page_updated_at"]
    latest_snapshot_changed = not last_history or last_history.get("mid") != snapshot["mid"] or last_history.get("official_page_updated_at") != snapshot["official_page_updated_at"]

    if not (prices_changed or page_date_changed or latest_snapshot_changed):
        print(json.dumps({"status": "unchanged", "official_page_updated_at": snapshot["official_page_updated_at"], "last_scraped_at": existing.get("last_scraped_at")}, ensure_ascii=False))
        return 0

    if existing_history:
        if last_history and last_history.get("mid") == snapshot["mid"] and last_history.get("official_page_updated_at") == snapshot["official_page_updated_at"]:
            history = existing_history
        else:
            history = existing_history + [current_entry]
    else:
        history = build_seed_history() + [current_entry]

    history = history[-30:]
    data = build_data(snapshot, history)
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "updated", "path": str(DATA_PATH), "official_page_updated_at": snapshot["official_page_updated_at"], "last_scraped_at": snapshot["last_scraped_at"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
