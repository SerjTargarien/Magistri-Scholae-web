from django.urls import path
from domain import views

urlpatterns = [
    path("api/v1/auth/csrf", views.csrf),
    path("api/v1/auth/me", views.me),
    path("api/v1/auth/login", views.sign_in),
    path("api/v1/auth/logout", views.sign_out),
    path("api/v1/auth/invitations", views.invitations),
    path("api/v1/auth/register", views.register),
    path("api/v1/auth/reset-codes", views.reset_codes),
    path("api/v1/auth/password-reset", views.password_reset),
    path("api/v1/auth/password-change", views.password_change),
    path("api/v1/admin/users/<uuid:user_id>/state", views.user_state),
    path("api/v1/campaigns", views.campaigns),
    path("api/v1/campaigns/<uuid:campaign_id>/members", views.memberships),
    path("api/v1/campaigns/<uuid:campaign_id>/skill-catalogue", views.skill_catalogue),
    path("api/v1/campaigns/<uuid:campaign_id>/visibility/preview", views.campaign_visibility_preview),
    path("api/v1/campaigns/<uuid:campaign_id>/visibility", views.campaign_visibility),
    path("api/v1/personal-notes", views.personal_notes),
    path("api/v1/personal-notes/<uuid:note_id>", views.personal_note),
    path("api/v1/schema", views.schema),
    path("api/v1/assets/<uuid:asset_id>", views.asset_download),
    path("api/v1/personal-notes/<uuid:note_id>/promote/preview", views.promotion_preview),
    path("api/v1/personal-notes/<uuid:note_id>/promote", views.promotion_apply),
]
for plural, kind in [("characters", "character"), ("familiars", "familiar")]:
    base = f"api/v1/{plural}"
    arguments = {"kind": kind}
    urlpatterns += [
        path(base, views.sheets, arguments),
        path(base + "/<uuid:sheet_id>", views.sheet_detail, arguments),
        path(base + "/<uuid:sheet_id>/manage", views.sheet_manage, arguments),
        path(base + "/<uuid:sheet_id>/sharing", views.sharing, arguments),
        path(base + "/<uuid:sheet_id>/visibility/preview", views.visibility_preview, arguments),
        path(base + "/<uuid:sheet_id>/visibility", views.visibility, arguments),
        path(base + "/<uuid:sheet_id>/bond", views.bond, arguments),
        path(base + "/<uuid:sheet_id>/gm-notes", views.gm_notes, arguments),
        path(base + "/<uuid:sheet_id>/assets", views.asset_upload, arguments),
    ]
handler404 = views.not_found
handler500 = views.server_error
