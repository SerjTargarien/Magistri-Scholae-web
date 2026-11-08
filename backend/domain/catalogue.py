"""Campaign skill catalogue (R3.2; owner decisions of 8 November 2026).

Each campaign has a catalogue of skill categories and default skills. A
character's default skill is stored as a link to its catalogue entry
(`catalogo`) with its own value; its name, category and position come from the
catalogue, so a GM change shows on every sheet without rewriting each one.
A skill a player invents keeps its own `nombre` and a catalogue `categoria`.

Positions are the order of the lists. Entries are archived, never deleted, so
no sheet ever links to a missing skill. The GM editor arrives in R4.
"""
import re
from copy import deepcopy
from .errors import APIError, require

ITEM_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
MAX_CATEGORIES = 50
MAX_SKILLS = 500
NAME_LENGTH = 60

_CATEGORIES = [
    ("fisicas", "Habilidades Físicas", "Physical Skills", False),
    ("mentales", "Habilidades Mentales", "Mental Skills", False),
    ("sociales", "Habilidades Sociales", "Social Skills", False),
    ("conocimientos-magicos", "Habilidades y conocimientos mágicos", "Magical Skills and Knowledge", False),
    ("magia-elemental", "Magia elemental", "Elemental Magic", False),
    ("magia-esoterica", "Magia esotérica", "Esoteric Magic", True),
]
_SKILLS = {
    "fisicas": [("atletismo", "Atletismo", "Athletics"), ("fisico", "Físico", "Physique"), ("deportes", "Deportes", "Sports"),
                ("sigilo", "Sigilo", "Stealth"), ("prestidigitacion", "Prestidigitación", "Sleight of Hand"),
                ("duelo", "Duelo", "Dueling"), ("supervivencia", "Supervivencia", "Survival")],
    "mentales": [("investigar", "Investigar", "Investigate"), ("percepcion", "Percepción", "Perception"),
                 ("voluntad", "Voluntad", "Willpower")],
    # Empatía moved from Mentales (owner decision, 8 November 2026; migration 0005).
    "sociales": [("contactos", "Contactos", "Contacts"), ("provocar", "Provocar", "Provoke"),
                 ("carisma", "Carisma", "Charisma"), ("engano", "Engaño", "Deception"), ("empatia", "Empatía", "Empathy")],
    "conocimientos-magicos": [
        ("magia-intuitiva", "Magia intuitiva", "Intuitive Magic"), ("historia-de-la-magia", "Historia de la magia", "History of Magic"),
        ("herbologia", "Herbología", "Herbology"), ("seres-magicos", "Seres mágicos", "Magical Creatures"),
        ("astronomia", "Astronomía", "Astronomy"), ("conocimiento-de-varitas", "Conocimiento de varitas", "Wand Lore"),
        ("leyes-y-costumbres", "Leyes y costumbres del mundo mágico", "Laws and Customs of the Magical World"),
        ("cultura-de-casa", "Cultura de casa", "House Culture"),
        # Classified by eye; confirmed by the owner.
        ("trivium", "Trivium", "Trivium"), ("quadrivium", "Quadrivium", "Quadrivium"), ("arte", "Arte", "Art"),
        ("conocimiento-muggle", "Conocimiento muggle", "Muggle Studies")],
    "magia-elemental": [("hermetica", "Hermética", "Hermetics"), ("transmutacion", "Transmutación", "Transmutation"),
                        ("pociones", "Pociones", "Potions")],
    "magia-esoterica": [
        ("magia-druidica", "Magia druídica", "Druidic Magic"), ("oraculos-y-adivinacion", "Oráculos y adivinación", "Oracles and Divination"),
        ("creacion-de-objetos-magicos", "Creación de objetos mágicos", "Magical Item Crafting"), ("espiritismo", "Espiritismo", "Spiritualism"),
        ("simpatica", "Simpática", "Sympathetic Magic"), ("quimerismo", "Quimerismo", "Chimerism"), ("oniromancia", "Oniromancia", "Oneiromancy"),
        ("musologia", "Musología", "Museology"), ("numerologia", "Numerología", "Numerology"), ("sanacion", "Sanación", "Healing"),
        ("cabala", "Cábala", "Kabbalah"), ("climatica", "Climática", "Weather Magic"), ("entropia", "Entropía", "Entropy"),
        ("cronomancia", "Cronomancia", "Chronomancy"), ("espejismo", "Espejismo", "Mirage & Illusion"),
        ("oclumancia", "Oclumancia", "Occlumency"), ("legeremancia", "Legeremancia", "Legilimency"), ("nigromancia", "Nigromancia", "Necromancy")],
}
# Magia intuitiva disappears for characters older than 14 (owner decision); the app hides it.
_MAX_AGE = {"magia-intuitiva": 14}

DEFAULT_CATALOGUE = {
    "categorias": [{"id": cid, "nombre": {"es": es, "en": en}, "esoterica": esoteric} for cid, es, en, esoteric in _CATEGORIES],
    "habilidades": [{"id": sid, "nombre": {"es": es, "en": en}, "categoria": cid, **({"edadMaxima": _MAX_AGE[sid]} if sid in _MAX_AGE else {})}
                    for cid, _, _, _ in _CATEGORIES for sid, es, en in _SKILLS[cid]],
}


def default_catalogue():
    return deepcopy(DEFAULT_CATALOGUE)


def _invalid(code, path, rule):
    return APIError(code, 400, {"path": path, "rule": rule})


def _name(value, path):
    require(isinstance(value, dict) and not (value.keys() - {"es", "en"}), "invalid_catalogue")
    es = value.get("es")
    if not (isinstance(es, str) and es.strip() and len(es) <= NAME_LENGTH):
        raise _invalid("invalid_catalogue", f"{path}/es", "required")
    en = value.get("en", "")
    if not (isinstance(en, str) and len(en) <= NAME_LENGTH):
        raise _invalid("invalid_catalogue", f"{path}/en", "maxLength")


def validate_catalogue(catalogue):
    """For the GM editor (R4) and the default; positions are list order."""
    require(isinstance(catalogue, dict) and set(catalogue) == {"categorias", "habilidades"}, "invalid_catalogue")
    categories, skills = catalogue["categorias"], catalogue["habilidades"]
    require(isinstance(categories, list) and len(categories) <= MAX_CATEGORIES, "invalid_catalogue")
    require(isinstance(skills, list) and len(skills) <= MAX_SKILLS, "invalid_catalogue")
    seen = set()
    for entry in categories:
        require(isinstance(entry, dict) and not (entry.keys() - {"id", "nombre", "esoterica", "archivada"}), "invalid_catalogue")
        require(isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"]) and entry["id"] not in seen, "invalid_catalogue")
        seen.add(entry["id"])
        _name(entry.get("nombre"), f"categorias/{entry['id']}/nombre")
        require(type(entry.get("esoterica", False)) is bool and type(entry.get("archivada", False)) is bool, "invalid_catalogue")
    category_ids, seen = set(seen), set()
    for entry in skills:
        require(isinstance(entry, dict) and not (entry.keys() - {"id", "nombre", "categoria", "edadMaxima", "archivada"}), "invalid_catalogue")
        require(isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"]) and entry["id"] not in seen, "invalid_catalogue")
        seen.add(entry["id"])
        _name(entry.get("nombre"), f"habilidades/{entry['id']}/nombre")
        require(entry.get("categoria") in category_ids, "invalid_catalogue")
        age = entry.get("edadMaxima")
        require(age is None or (type(age) is int and 0 <= age <= 999), "invalid_catalogue")
        require(type(entry.get("archivada", False)) is bool, "invalid_catalogue")


def check_skills(skills, catalogue, only=None):
    """Catalogue rules for a character's skills: links and categories exist,
    knowledge only in esoteric categories, no skill twice. `only` limits the
    checks to the entries a save touched, so a later GM change to the
    catalogue never blocks saves of untouched skills."""
    categories = {c["id"]: c for c in catalogue["categorias"]}
    linked = {s["id"]: s for s in catalogue["habilidades"]}
    catalogue_names = {n.strip().casefold() for s in catalogue["habilidades"] for n in s["nombre"].values() if n}
    seen_links, seen_names = {}, {}
    for entry in skills or []:
        if entry.get("catalogo"):
            seen_links.setdefault(entry["catalogo"], []).append(entry["id"])
        elif entry.get("nombre"):
            seen_names.setdefault(entry["nombre"].strip().casefold(), []).append(entry["id"])
    for entry in skills or []:
        if only is not None and entry["id"] not in only:
            continue
        path = f"habilidades/{entry['id']}"
        if entry.get("catalogo"):
            skill = linked.get(entry["catalogo"])
            if skill is None:
                raise _invalid("unknown_skill", f"{path}/catalogo", "catalogue")
            if len(seen_links[entry["catalogo"]]) > 1:
                raise _invalid("duplicate_skill", path, "unique")
            category = categories[skill["categoria"]]
        else:
            category = categories.get(entry.get("categoria"))
            if category is None:
                raise _invalid("unknown_category", f"{path}/categoria", "catalogue")
            name = entry["nombre"].strip().casefold()
            if len(seen_names[name]) > 1 or name in catalogue_names:
                raise _invalid("duplicate_skill", f"{path}/nombre", "unique")
        if entry.get("conocimiento") and not category.get("esoterica"):
            raise _invalid("knowledge_not_allowed", f"{path}/conocimiento", "esotericOnly")
