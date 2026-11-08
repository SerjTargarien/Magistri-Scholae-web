# Product design

The place to design a change before building it (owner request, 8 November 2026): what each screen shows, what each role can do, and the rules behind it. A change starts here; the code follows. Interface terms are the app's Spanish ones.

**Status:** started 8 November 2026 with the design notes below. The screen-by-screen description of today's app is still to be written.

## Roles (today)

- **GM:** sees and edits every character and familiar in the campaign, whoever created them and whenever they registered. Owns the campaign's skill list («Habilidades de la campaña»).
- **Player:** sees and edits only the sheets they created (assigned to them). Picks skills from the campaign's list.
- The campaign is the GM's universe; its tables (mesas) are labels on sheets (decision 9, R4). The full permission system (sharing, GM restrictions, personal notes) comes later.

## Design notes

Recorded decisions and ideas that are not designed in detail or built yet.

### The GM's tools: characters, institutions and skills (owner, 8 November 2026)

For now the GM needs three things, each **per campaign (universe)**, and not much more:

- **Characters:** the GM's view of every character in the campaign, and the GM's own (non-player) characters.
- **Institutions:** a campaign list of institutions (academies, ministries, guilds…). Today «Institución» is free text on the adult wizard profile, and a house or organization motto is planned for after 1.0. To decide:
  - what an institution holds (name, description, motto, crest?);
  - whether characters pick their institution from the list, as players pick skills;
  - how institutions relate to the houses.
- **Skills:** the campaign's skill list. Started in C2 («Habilidades de la campaña»: rename, «Inicial», add); moving skills between categories, reordering and new categories are R4.

Everything else in the GM screens of the plan (members, tables, assignment, archive and restore, GM notes) waits unless the owner brings it forward.

### Non-magical characters (owner, 8 November 2026)

- A non-magical character uses **the same sheet** as a magical one, with a switch saying whether the character has magical abilities.
- **Switch off:** the sheet hides the fields related to magic. Candidates, to be confirmed field by field:
  - «Varita / Foco mágico»;
  - the skill categories «Habilidades y conocimientos mágicos», «Magia elemental» and «Magia esotérica» (with the knowledge levels);
  - the «Conjuros y Pociones» tab.
- **Hidden, not deleted:** the values stay stored, as Magia intuitiva does above age 14, and turning the switch back on shows them again.
- **To decide:**
  - who can change the switch (the player at creation, the GM afterwards?);
  - whether it is chosen in the type selection or is a switch on any character, and whether it applies to students;
  - whether a non-magical character's starting skills leave out the magic categories;
  - whether non-magical characters can have familiars.
- Data: one new boolean field on the character (absent meaning magical, so existing sheets need no change), with its rule in field-rules.md.

### Recorded for later

- **Full-screen image viewer** for portraits; the character and familiar galleries already enlarge a picture on tap.
- **The GM renames the campaign** name he sees (R4).
- **Recovery and invitation links** created from the admin screens (R4); decide how long a recovery code lasts (15 minutes today).
- **Remaining phase 3** (implementation-plan.md, R3.4):
  - destiny gems up to 10;
  - typeable experience;
  - consequence severity;
  - taught subjects as a list;
  - generated journal titles shown, not stored;
  - a name box that can be emptied while typing;
  - counters near limits;
  - images from a web address (downloaded by the server; needs its own security review).
- **Testing on a real phone** before each release: a short checklist, since some bugs only appear with a real keyboard or without hover.
- **A development copy of the testers' data:** staging now holds their real data (the public site uses the staging backend), so development needs a separate copy.
