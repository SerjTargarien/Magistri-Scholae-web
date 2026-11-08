/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Language, TRANSLATIONS } from "../localization";
import type { SettingsScreenProps } from "../account/screens";
import { CAMPAIGN_SKILLS_TEXT } from "../account/CampaignSkills";
import { 
  Languages, 
  Database, 
  Sparkles,
  ArrowLeft,
  CheckCircle,
  CircleUser,
  LogOut,
  ListChecks,
  Palette
} from "lucide-react";

// New settings texts (R3.4), kept here until they move into localization.ts.
const SETTINGS_TEXT: Record<Language, {
  storageNote: string;
  accountTitle: string;
  campaignLabel: string;
  logout: string;
}> = {
  es: {
    storageNote: "Tus fichas se guardan en el servidor de la campaña. Este navegador solo guarda tus preferencias de idioma y estilo.",
    accountTitle: "Cuenta",
    campaignLabel: "Campaña",
    logout: "Cerrar sesión",
  },
  en: {
    storageNote: "Your sheets are stored on the campaign's server. This browser only keeps your language and style preferences.",
    accountTitle: "Account",
    campaignLabel: "Campaign",
    logout: "Sign out",
  },
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  lang,
  onLanguageChange,
  visualStyle,
  onStyleChange,
  onBack,
  account,
}) => {
  const t = TRANSLATIONS[lang];
  const s = SETTINGS_TEXT[lang];

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
        
        {/* Visual Style Selector Card */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2 relative overflow-hidden" id="settings-card-style">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
              {t.settingsStyleTitle}
            </h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
            {t.settingsStyleExplanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Magic Academy */}
            <button
              type="button"
              id="btn-style-academy"
              onClick={() => onStyleChange("academy")}
              className={`relative text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                visualStyle === "academy"
                  ? "bg-gradient-to-br from-[#231838] to-[#110c1d] border-[#c8a248] shadow-[0_0_20px_rgba(200,162,72,0.2)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#f3d88c] to-[#9b7424] border border-amber-200 shadow-sm shrink-0" />
                  <span className="font-magic text-sm font-bold text-amber-300 uppercase tracking-wider">
                    {t.styleAcademyName}
                  </span>
                </div>
                {visualStyle === "academy" && (
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                {t.styleAcademyDesc}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-5 h-2.5 rounded-xs bg-[#161224] border border-[#c8a248]/60" />
                <span className="w-5 h-2.5 rounded-xs bg-[#e5d6b8] border border-[#8c6722]" />
                <span className="w-5 h-2.5 rounded-xs bg-[#c8a248]" />
              </div>
            </button>

            {/* Option 2: Classic */}
            <button
              type="button"
              id="btn-style-classic"
              onClick={() => onStyleChange("classic")}
              className={`relative text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                visualStyle === "classic"
                  ? "bg-violet-950/60 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-violet-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-900 border border-violet-300 shadow-sm shrink-0" />
                  <span className="font-magic text-sm font-bold text-violet-200 uppercase tracking-wider">
                    {t.styleClassicName}
                  </span>
                </div>
                {visualStyle === "classic" && (
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {t.styleClassicDesc}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-5 h-2.5 rounded-xs bg-[#08040f] border border-violet-500/40" />
                <span className="w-5 h-2.5 rounded-xs bg-[#140d26] border border-violet-500/40" />
                <span className="w-5 h-2.5 rounded-xs bg-amber-500" />
              </div>
            </button>
          </div>
        </div>

        {/* Localization & Preferences Card */}
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

        {/* Storage Details */}
        <div className="glass-panel p-6 rounded-xl border border-violet-500/15" id="settings-card-storage">
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
              <div className="text-sm text-neutral-200 font-medium truncate">
                {account.displayName}
              </div>
              <div className="text-[11px] text-neutral-500 font-mono truncate">
                {account.username}
              </div>
            </div>

            {account.campaigns.length > 1 && (
              <div className="flex items-center gap-3 sm:ml-auto">
                <label htmlFor="settings-campaign-select" className="text-sm text-neutral-300 font-medium">
                  {s.campaignLabel}:
                </label>
                <select
                  id="settings-campaign-select"
                  value={account.campaignId}
                  onChange={(e) => account.onChangeCampaign(e.target.value)}
                  className="bg-neutral-900 border border-violet-500/30 text-amber-300 p-2 rounded-md font-medium font-mono text-sm cursor-pointer"
                >
                  {account.campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
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

        {/* Campaign skills: the GM's list for this universe (C2) */}
        {account.onOpenCampaignSkills && (
          <div className="glass-panel p-6 rounded-xl border border-violet-500/15 md:col-span-2" id="settings-card-campaign-skills">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-5 h-5 text-amber-500" />
              <h2 className="font-magic text-md text-neutral-200 uppercase tracking-wider">
                {CAMPAIGN_SKILLS_TEXT[lang].title}
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs text-neutral-400 font-sans leading-relaxed flex-1">{CAMPAIGN_SKILLS_TEXT[lang].openHint}</p>
              <button
                type="button"
                id="btn-settings-campaign-skills"
                onClick={account.onOpenCampaignSkills}
                className="flex items-center justify-center gap-2 text-sm text-amber-300 bg-neutral-900/60 hover:bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all font-mono cursor-pointer shrink-0"
              >
                <ListChecks className="w-4 h-4" />
                {CAMPAIGN_SKILLS_TEXT[lang].open}
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
