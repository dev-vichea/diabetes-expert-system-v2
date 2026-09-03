"""Backend message catalog — the single source of truth for generated text.

Every patient- or clinician-facing string that the backend *composes at
runtime* (result summaries, headline explanations, confidence notes,
urgency reasons, recommendation rewrites, conversational messages…) lives
in a JSON catalog under ``app/locales/`` instead of being hardcoded in
service code. Each catalog entry carries BOTH languages::

    {
        "summary_key": {
            "en": "This assessment combined {s_count} symptom(s)…",
            "km": "ការវាយតម្លៃនេះបញ្ចូល {s_count} អាការៈ…"
        }
    }

Catalogs are loaded once per process (cached) and placeholders use
``str.format`` style: ``{s_count}``, ``{certainty_percent}``, …

Public helpers:
    text(name, key, lang="en", **params)      -> formatted str (en fallback)
    bilingual(name, key, **params)            -> {"en": …, "km": …}
    pick(entry, lang="en")                    -> choose from a {en,km} dict
    join_bilingual(parts, sep="; ")           -> join {en,km} fragment dicts
"""

import json
from functools import lru_cache
from pathlib import Path

SUPPORTED_LANGUAGES = ("en", "km")
DEFAULT_LANGUAGE = "en"

_LOCALES_DIR = Path(__file__).resolve().parents[1] / "locales"


class MissingCatalogError(LookupError):
    """Raised when a catalog name does not exist under app/locales."""


@lru_cache(maxsize=None)
def load_catalog(name: str) -> dict:
    """Load and cache a catalog JSON file by name (without extension)."""
    path = _LOCALES_DIR / f"{name}.json"
    if not path.is_file():
        raise MissingCatalogError(f"Message catalog not found: {path}")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _entry(catalog: dict, key: str) -> dict:
    entry = catalog.get(key)
    if isinstance(entry, dict):
        return entry
    # Tolerate plain strings so a catalog can mix bilingual entries with
    # language-neutral constants.
    return {"en": entry} if entry is not None else {}


def pick(entry, lang: str = DEFAULT_LANGUAGE, **params) -> str:
    """Choose a language variant from a {en, km} dict (or plain string).

    Falls back to English when the requested language is missing, then to
    whatever variant exists, and finally formats placeholders if provided.
    """
    if entry is None:
        return ""
    if not isinstance(entry, dict):
        value = str(entry)
    else:
        lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
        value = entry.get(lang) or entry.get(DEFAULT_LANGUAGE) or ""
        if not value and entry:
            value = str(next(iter(entry.values())))
    if params:
        try:
            value = value.format(**params)
        except (KeyError, IndexError, ValueError):
            pass
    return value


def text(name: str, key: str, lang: str = DEFAULT_LANGUAGE, **params) -> str:
    """Formatted text for one catalog entry in one language."""
    return pick(_entry(load_catalog(name), key), lang=lang, **params)


def bilingual(name: str, key: str, **params) -> dict:
    """Both language variants for one catalog entry: {"en": …, "km": …}."""
    entry = _entry(load_catalog(name), key)
    return {lang: pick(entry, lang=lang, **params) for lang in SUPPORTED_LANGUAGES}


def join_bilingual(parts, sep: str = "; ") -> dict | None:
    """Join a list of {en, km} fragment dicts into one dict per language."""
    fragments = [p for p in parts if p and (p.get("en") or p.get("km"))]
    if not fragments:
        return None
    return {
        lang: sep.join(pick(f, lang=lang) for f in fragments if pick(f, lang=lang))
        for lang in SUPPORTED_LANGUAGES
    }
