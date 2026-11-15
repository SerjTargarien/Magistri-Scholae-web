# A character can belong to several partidas (owner, 15 November 2026); none means common
# to all. Each sheet's single partida becomes the first of its list.

from django.db import migrations, models


def copy_partidas(apps, schema_editor):
    Sheet = apps.get_model("domain", "Sheet")
    for sheet in Sheet.objects.exclude(table=None):
        sheet.tables.add(sheet.table_id)


def restore_partida(apps, schema_editor):
    Sheet = apps.get_model("domain", "Sheet")
    for sheet in Sheet.objects.all():
        first = sheet.tables.order_by("created_at", "id").first()
        if first:
            sheet.table = first
            sheet.save(update_fields=["table"])


class Migration(migrations.Migration):

    dependencies = [
        ("domain", "0011_admin_access"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sheet",
            name="table",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="+", to="domain.table"),
        ),
        migrations.AddField(
            model_name="sheet",
            name="tables",
            field=models.ManyToManyField(blank=True, related_name="sheets", to="domain.table"),
        ),
        migrations.RunPython(copy_partidas, restore_partida),
        migrations.RemoveField(
            model_name="sheet",
            name="table",
        ),
    ]
