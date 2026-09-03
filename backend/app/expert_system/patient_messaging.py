"""Patient-facing message rewriting layer.

Clinical rule outputs (seed rules + clinician-authored rules + legacy
defaults) are written in clinical language. At the service boundary every
known recommendation string is rewritten into short, patient-friendly
text — in BOTH languages — so the UI can render the right one immediately.

The single source of truth is the bilingual JSON catalog
``app/locales/patient_messages.json`` (the ``{en, km}`` pattern shared by
every backend locale file). The clinical strings are the catalog KEYS and
each entry carries its patient-friendly English and Khmer renderings.
Unknown strings pass through unchanged (whitespace-normalised so
lookup/display stay stable).

To change wording: edit ``app/locales/patient_messages.json`` — no code
change needed. Keep the English value aligned with the frontend
exactTextMap so older saved results keep translating.
"""

from app.utils.i18n import SUPPORTED_LANGUAGES, load_catalog, pick

CATALOG = "patient_messages"

# Well-known catalog notes (also usable as default diagnosis strings).
NOTE_LAB_NORMAL_BUT_SYMPTOMS_KEY = "NOTE_LAB_NORMAL_BUT_SYMPTOMS"
NOTE_NO_LABS_COMPLETENESS_KEY = "NOTE_NO_LABS_COMPLETENESS"
NOTE_URGENT_SAFETY_KEY = "NOTE_URGENT_SAFETY"


def _catalog() -> dict:
    return load_catalog(CATALOG)


def _value_index() -> dict:
    """Reverse index: patient-friendly English value -> catalog entry."""
    return {entry.get("en", ""): entry for entry in _catalog().values() if entry.get("en")}


def _lookup(text: str) -> dict | None:
    """Find the catalog entry for a clinical string OR an already-rewritten
    patient-friendly string (makes rewriting idempotent)."""
    key = _normalize_key(text)
    if not key:
        return None
    entry = _catalog().get(key)
    if entry is None:
        entry = _value_index().get(key)
    return entry


def _normalize_key(text: str) -> str:
    return " ".join(str(text or "").split())


def rewrite_recommendation(text: str) -> str:
    """Return the patient-friendly ENGLISH text for a known clinical string."""
    entry = _lookup(text)
    return pick(entry, lang="en") if entry else _normalize_key(text)


def rewrite_recommendation_bilingual(text: str) -> dict:
    """Return {"en": …, "km": …} for a known clinical string. Unknown
    strings pass through unchanged in both languages."""
    entry = _lookup(text)
    if not entry:
        normalized = _normalize_key(text)
        return {lang: normalized for lang in SUPPORTED_LANGUAGES}
    return {lang: pick(entry, lang=lang) for lang in SUPPORTED_LANGUAGES}


def note_bilingual(key: str) -> dict:
    """Both languages for a well-known NOTE_* catalog key."""
    entry = _catalog().get(key) or {}
    return {lang: pick(entry, lang=lang) for lang in SUPPORTED_LANGUAGES}


# Backward-compatible English constants — the inference engine returns these
# as default diagnosis strings and other modules import them directly.
LAB_NORMAL_BUT_SYMPTOMS_NOTE = pick(_catalog()[NOTE_LAB_NORMAL_BUT_SYMPTOMS_KEY], lang="en")
COMPLETENESS_NOTE = pick(_catalog()[NOTE_NO_LABS_COMPLETENESS_KEY], lang="en")
URGENT_SAFETY_NOTE = pick(_catalog()[NOTE_URGENT_SAFETY_KEY], lang="en")

