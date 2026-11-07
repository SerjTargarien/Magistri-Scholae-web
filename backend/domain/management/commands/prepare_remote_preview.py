from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import transaction
import psycopg


class Command(BaseCommand):
    help = "Create only the isolated magistri_preview database and fictional accounts. Never reset existing data."
    requires_system_checks = []

    def handle(self, *args, **options):
        config = settings.DATABASES["default"]
        if not getattr(settings, "ISOLATED_PREVIEW", False) or config["NAME"] != "magistri_preview" or config["HOST"] not in ("localhost", "127.0.0.1"):
            raise CommandError("Use --settings=config.preview_settings with loopback PostgreSQL")
        with psycopg.connect(dbname="postgres", user=config["USER"], password=config["PASSWORD"], host=config["HOST"], port=config["PORT"], autocommit=True) as connection:
            if not connection.execute("SELECT 1 FROM pg_database WHERE datname = %s", ["magistri_preview"]).fetchone():
                connection.execute("CREATE DATABASE magistri_preview")
        call_command("migrate", verbosity=0)
        from domain.models import Campaign, Membership, Share, Sheet, User
        with transaction.atomic():
            if User.objects.exists():
                self.stdout.write("Existing preview retained; no accounts or records changed.")
                return
            users = {name: User.objects.create_user(name, password="Fictional-preview-only-42!") for name in ("preview_gm", "preview_alice", "preview_bob")}
            campaign = Campaign.objects.create(name="Fictional preview academy")
            for name, user in users.items():
                Membership.objects.create(campaign=campaign, user=user, role="gm" if name == "preview_gm" else "player")
            student = Sheet.objects.create(campaign=campaign, creator=users["preview_gm"], assigned_player=users["preview_alice"], kind="character",
                gm_default="shared", gm_overrides={"adultWizardProfile/reputation": "gm"},
                data={"nombre": "Fictional Luna", "characterType": "student", "concepto": "Fictional student",
                    "adultWizardProfile": {"reputation": "Fictional GM-only clue"}, "notasList": []})
            Sheet.objects.create(campaign=campaign, creator=users["preview_gm"], assigned_player=users["preview_alice"], kind="character",
                data={"nombre": "Fictional Professor", "characterType": "adult_wizard", "adultWizardProfile": {"role": "Professor", "isTeacher": True}})
            Sheet.objects.create(campaign=campaign, creator=users["preview_gm"], assigned_player=users["preview_alice"], kind="familiar",
                data={"nombre": "Fictional Owl", "especie": "Owl", "descripcion": "Fictional familiar"})
            Share.objects.create(sheet=student, recipient=users["preview_bob"])
        self.stdout.write("Isolated fictional preview ready. Credentials are documented in backend/README.md.")
