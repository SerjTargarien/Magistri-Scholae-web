/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ADMIN_TEXT, CAMPAIGN_GM_TEXT, Language, SETTINGS_TEXT, TRANSLATIONS } from "../localization";
import type { SettingsScreenProps } from "../account/screens";
import { Picker, pickerTexts } from "./Picker";
import { 
  Languages, 
  Database, 
  Sparkles,
  ArrowLeft,
  ChevronDown,
  CircleUser,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  lang,
  onLanguageChange,
  onBack,
  account,
  onOpenAdmin,
  campaignSettings,
}) => {
  const t = TRANSLATIONS[lang];
  const s = SETTINGS_TEXT[lang];
  const [choosingCampaign, setChoosingCampaign] = useState(false);
  const g = CAMPAIGN_GM_TEXT[lang];
  const [campaignName, setCampaignName] = useState(campaignSettings?.name ?? "");
  const [newCampaign, setNewCampaign] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);
  const campaignBox = "flex-1 min-w-0 text-sm bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none";
  const campaignButton = "shrink-0 px-3 py-1.5 bg-violet-900 border border-violet-500/35 hover:bg-violet-800 text-violet-100 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const campaignAct = async (run: () => Promise<void>) => { setSavingCampaign(true); try { await run(); } finally { setSavingCampaign(false); } };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="settings-screen">
      {/* Top Bar Navigation */}
      <div className="flex justify-between items-center mb-8 border-b border-violet-500/15 pb-4">
        <button 
          id="btn-settings-back"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h1 className="font-magic text-xl md:text-2xl text-neutral-100 uppercase tracking-widest glow-amber">
            {t.settings}
          </h1>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Localization & Preferences Card: hidden while the interface is Spanish only */}
        {onLanguageChange && (
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-lang">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.languageSelector}
            </h2>
          </div>
          
          <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
            {t.settingsLanguageExplanation}
          </p>

          <div className="flex items-center gap-4 bg-neutral-950/40 p-4 border border-violet-500/10 rounded-lg">
            <span className="text-sm text-neutral-300 font-medium">
              {t.settingsCurrentLanguage}:
            </span>
            <select
              id="settings-language-dropdown"
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-neutral-900 border border-violet-500/30 text-amber-300 p-2 rounded-md font-medium font-mono text-sm cursor-pointer ml-auto"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>
        )}

        {/* Storage Details */}
        <div className={`glass-panel p-6 rounded-xl border border-violet-500/15 ${onLanguageChange ? "" : "md:col-span-2"}`} id="settings-card-storage">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.storageInfo}
            </h2>
          </div>

          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed bg-neutral-950/30 p-4 border border-violet-900/10 rounded-lg">
            <p>{s.storageNote}</p>
          </div>
        </div>

        {/* Account & Campaign */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="settings-card-account">
          <div className="flex items-center gap-2 mb-4">
            <CircleUser className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {s.accountTitle}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-neutral-950/40 p-4 border border-violet-500/10 rounded-lg">
            <div className="min-w-0">
              <div className="text-sm text-neutral-200 font-medium break-words">
                {account.displayName}
              </div>
              <div className="text-[11px] text-neutral-500 font-mono break-all">
                {account.username}
              </div>
            </div>

            {account.campaigns.length > 1 && (
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className="text-sm text-neutral-300 font-medium">{s.campaignLabel}:</span>
                <button
                  id="settings-campaign-select"
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setChoosingCampaign(true)}
                  className="inline-flex items-center gap-2 min-h-10 px-3 rounded-lg border border-amber-600/50 bg-gradient-to-b from-[#231c35] to-[#130f1e] text-amber-300 text-sm font-medium cursor-pointer hover:border-[#f3d88c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="break-words text-left">{account.campaigns.find((c) => c.id === account.campaignId)?.name}</span>
                  <ChevronDown className="w-4 h-4 shrink-0" />
                </button>
                {choosingCampaign && (
                  <Picker
                    id="campaign-picker"
                    title={s.campaignLabel}
                    items={account.campaigns.map((campaign) => ({ id: campaign.id, label: campaign.name }))}
                    selected={account.campaignId}
                    onPick={(id) => { setChoosingCampaign(false); if (id !== account.campaignId) account.onChangeCampaign(id); }}
                    onClose={() => setChoosingCampaign(false)}
                    texts={pickerTexts(t)}
                  />
                )}
              </div>
            )}

            <button
              type="button"
              id="btn-settings-logout"
              onClick={account.onLogout}
              className={`flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-amber-400 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/40 transition-all font-mono cursor-pointer ${
                account.campaigns.length > 1 ? "" : "sm:ml-auto"
              }`}
            >
              <LogOut className="w-4 h-4" />
              {s.logout}
            </button>
          </div>
        </div>

        {/* The Máster's campaign (R4 d): its name, and a new campaign of which he will be the Máster */}
        {campaignSettings && (
          <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="settings-card-campaign">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">{g.campaign}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <form className="grid gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = campaignName.trim(); if (name && name !== campaignSettings.name) void campaignAct(() => campaignSettings.onRename(name)); }}>
                <label htmlFor="input-campaign-name" className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold">{g.campaignName}</label>
                <div className="flex gap-2">
                  <input id="input-campaign-name" type="text" maxLength={120} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className={campaignBox} />
                  <button id="btn-rename-campaign" type="submit" disabled={savingCampaign || !campaignName.trim() || campaignName.trim() === campaignSettings.name} className={campaignButton}>{g.rename}</button>
                </div>
              </form>
              <form className="grid gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = newCampaign.trim(); if (name) void campaignAct(async () => { await campaignSettings.onCreate(name); setNewCampaign(""); }); }}>
                <label htmlFor="input-new-campaign-gm" className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold">{g.newCampaign}</label>
                <div className="flex gap-2">
                  <input id="input-new-campaign-gm" type="text" maxLength={120} value={newCampaign} placeholder={g.campaignName} onChange={(e) => setNewCampaign(e.target.value)} className={campaignBox} />
                  <button id="btn-create-campaign-gm" type="submit" disabled={savingCampaign || !newCampaign.trim()} className={campaignButton}>{g.create}</button>
                </div>
                <p className="text-[11px] text-neutral-500">{g.newCampaignHint}</p>
              </form>
            </div>
            {campaignSettings.accessCard}
          </div>
        )}

        {/* «Administración»: the site administrator only (R4 a) */}
        {onOpenAdmin && (
          <div className="glass-panel p-6 rounded-xl border border-amber-500/25 md:col-span-2" id="settings-card-admin">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">{ADMIN_TEXT[lang].title}</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs text-neutral-400 font-sans leading-relaxed flex-1">{ADMIN_TEXT[lang].openHint}</p>
              <button
                type="button"
                id="btn-settings-admin"
                onClick={onOpenAdmin}
                className="flex items-center justify-center gap-2 text-sm text-amber-300 hover:text-amber-200 bg-violet-950/60 hover:bg-violet-900/70 px-3 py-1.5 rounded-lg border border-amber-500/40 transition-all font-mono cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {ADMIN_TEXT[lang].open}
              </button>
            </div>
          </div>
        )}

        {/* About App - Bottom-most section in full width */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="settings-card-about">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.about} {t.appName}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-3">
            {t.aboutDescription}
          </p>
          <div className="text-[11px] text-neutral-500 font-mono text-center pt-2 border-t border-violet-500/10">
            {t.schoolSealPrefix}
          </div>
        </div>

      </div>
    </div>
  );
};
