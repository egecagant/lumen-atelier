import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Palette, 
  Bookmark, 
  BookmarkPlus, 
  Trash2, 
  Check, 
  Save, 
  Loader2,
  Eye,
  CheckCircle2,
  Activity,
  MoveHorizontal,
  Zap,
  Flame,
  Gauge
} from 'lucide-react';
import { useSiteSettings, AnnouncementTemplate } from '../../context/SiteSettingsContext';

type AnimationType = 'none' | 'marquee' | 'pulse' | 'shimmer' | 'bounce';
type SpeedType = 'slow' | 'normal' | 'fast';

const ANIMATION_OPTIONS: { id: AnimationType; name: string; desc: string; icon: React.ReactNode }[] = [
  { 
    id: 'none', 
    name: 'Sabit (Animasyonsuz)', 
    desc: 'Sade, dingin ve hareketsiz metin görünümü',
    icon: <Sparkles className="w-4 h-4" />
  },
  { 
    id: 'marquee', 
    name: 'Kayan Yazı (Sonsuz Bant)', 
    desc: 'Yazı sağdan sola kesintisiz ve akıcı bir şekilde kayar',
    icon: <MoveHorizontal className="w-4 h-4" />
  },
  { 
    id: 'pulse', 
    name: 'Yanıp Sönen (Işıltılı Pulse)', 
    desc: 'Yazı ve ikon ritmik olarak dikkat çekici şekilde yanıp söner',
    icon: <Activity className="w-4 h-4" />
  },
  { 
    id: 'shimmer', 
    name: 'Işık Dalgası (Altın Işıma)', 
    desc: 'Yazının üzerinden zarif parlak bir ışık hüzmesi geçer',
    icon: <Zap className="w-4 h-4" />
  },
  { 
    id: 'bounce', 
    name: 'Hafif Salınım (Zarif Float)', 
    desc: 'Metin yukarı ve aşağı hafifçe zarafetle salınır',
    icon: <Flame className="w-4 h-4" />
  }
];

const SPEED_OPTIONS: { id: SpeedType; name: string; desc: string }[] = [
  { id: 'slow', name: 'Yavaş', desc: 'Dingin & Lüks tempo' },
  { id: 'normal', name: 'Normal', desc: 'Standart akıcı tempo' },
  { id: 'fast', name: 'Hızlı', desc: 'Dinamik & Vurgulu tempo' }
];

export const AnnouncementManager: React.FC = () => {
  const { settings, updateSettings } = useSiteSettings();

  const [active, setActive] = useState(settings.announcementActive);
  const [text, setText] = useState(settings.announcementText);
  const [bgColor, setBgColor] = useState(settings.announcementBgColor || '#121215');
  const [textColor, setTextColor] = useState(settings.announcementTextColor || '#C5A059');
  const [animation, setAnimation] = useState<AnimationType>(settings.announcementAnimation || 'none');
  const [speed, setSpeed] = useState<SpeedType>(settings.announcementSpeed || 'normal');
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>(settings.savedAnnouncementTemplates || []);
  
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with context settings
  useEffect(() => {
    setActive(settings.announcementActive);
    setText(settings.announcementText);
    setBgColor(settings.announcementBgColor || '#121215');
    setTextColor(settings.announcementTextColor || '#C5A059');
    setAnimation(settings.announcementAnimation || 'none');
    setSpeed(settings.announcementSpeed || 'normal');
    setTemplates(settings.savedAnnouncementTemplates || []);
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings({
        announcementActive: active,
        announcementText: text,
        announcementBgColor: bgColor,
        announcementTextColor: textColor,
        announcementAnimation: animation,
        announcementSpeed: speed,
        savedAnnouncementTemplates: templates,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save announcement settings:', error);
      alert('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Lütfen önce duyuru metnini yazın.');
      return;
    }

    const name = newTemplateName.trim() || `Şablon #${templates.length + 1}`;
    const newTpl: AnnouncementTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      text: text.trim(),
      bgColor,
      textColor,
      animation,
      speed,
      createdAt: Date.now()
    };

    const updated = [newTpl, ...templates];
    setTemplates(updated);
    setNewTemplateName('');
    
    // Auto persist templates to settings
    updateSettings({ savedAnnouncementTemplates: updated });
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    updateSettings({ savedAnnouncementTemplates: updated });
  };

  const handleApplyTemplate = (tpl: AnnouncementTemplate, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setText(tpl.text);
    if (tpl.bgColor) setBgColor(tpl.bgColor);
    if (tpl.textColor) setTextColor(tpl.textColor);
    if (tpl.animation) setAnimation(tpl.animation);
    if (tpl.speed) setSpeed(tpl.speed);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-semibold mb-1">
            <Megaphone className="w-4 h-4 text-[#C5A059]" />
            <span>Admin Paneli / Duyuru Yönetimi</span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Üst Duyuru & Kampanya Bandı
          </h2>
          <p className="text-xs text-zinc-400 font-light mt-1 max-w-xl">
            Mağazanızın en üstünde yer alan duyuru metnini, animasyon efektlerini (kayan yazı, yanıp sönme vb.) ve renklerini yönetin.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            saveSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black shadow-[#C5A059]/20'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Kaydediliyor...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Başarıyla Kaydedildi</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Card */}
        <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-7 border border-white/10">
          
          {/* Active/Inactive Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h3 className="font-sans text-lg font-bold text-white flex items-center gap-2 tracking-wide">
                <Eye className="w-5 h-5 text-[#C5A059]" />
                <span>Yayınlanma Durumu</span>
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-1">
                Duyuru bandının mağazanın üst kısmında ziyaretçilere gösterilip gösterilmeyeceğini belirleyin.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-black/50 px-4 py-2.5 rounded-xl border border-white/10 self-start sm:self-auto">
              <button
                type="button"
                role="switch"
                id="admin-announcement-toggle"
                aria-checked={active}
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                  active ? 'bg-[#C5A059]' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-zinc-200 select-none">
                {active ? 'Aktif (Yayında)' : 'Pasif (Gizli)'}
              </span>
            </div>
          </div>

          {/* Announcement Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                Duyuru Metni
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {text?.length || 0} karakter
              </span>
            </div>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors leading-relaxed"
              placeholder="✨ Tüm Türkiye’ye Ücretsiz Sigortalı Kargo | Özel Proje Talepleri İçin İletişime Geçin"
            />
          </div>

          {/* ANIMATION & SPEED SELECTION */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-xs uppercase tracking-widest text-zinc-200 font-bold">
                  Animasyon & Hareket Efekti (Opsiyonel)
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400">Canlı önizlemede anında test edin</span>
            </div>

            {/* Animation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ANIMATION_OPTIONS.map((opt) => {
                const isSelected = animation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnimation(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 relative ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/10 ring-2 ring-[#C5A059]/30 shadow-md'
                        : 'border-white/10 hover:border-white/20 bg-black/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#C5A059] text-black' : 'bg-white/10 text-zinc-300'}`}>
                          {opt.icon}
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#C5A059]' : 'text-zinc-200'}`}>
                          {opt.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#C5A059] shadow-sm animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-light">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Speed Options (Only if animation is not 'none') */}
            {animation !== 'none' && (
              <div className="pt-3 border-t border-white/5 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                    Animasyon Hızı
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {SPEED_OPTIONS.map((spd) => {
                    const isSpeedSelected = speed === spd.id;
                    return (
                      <button
                        key={spd.id}
                        type="button"
                        onClick={() => setSpeed(spd.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSpeedSelected
                            ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059] font-bold shadow-sm'
                            : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }`}
                      >
                        <div className="text-xs font-semibold">{spd.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{spd.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Color Palettes and Custom Pickers */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-xs uppercase tracking-widest text-zinc-200 font-bold">
                  Renk Seçimi (Arka Plan ve Yazı Rengi)
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400">Canlı olarak anında uygulanır</span>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-zinc-950/70 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-0.5">
                    Arka Plan Rengi
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {bgColor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/20 p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/70 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-0.5">
                    Yazı & İkon Rengi
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {textColor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/20 p-0.5"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-24 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User Custom Templates */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-xs uppercase tracking-widest text-zinc-200 font-bold">
                  Özel Şablonlarım
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400">
                {templates.length} Kayıtlı Şablon
              </span>
            </div>

            {/* Save Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950/70 p-3 rounded-xl border border-white/10">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Şablon İsmi (Örn: Hafta Sonu Kampanyası, Lansman...)"
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Mevcut Ayarları Şablon Olarak Kaydet</span>
              </button>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-zinc-950/50 border border-dashed border-white/10">
                <Bookmark className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Henüz kayıtlı özel şablonunuz bulunmuyor.</p>
                <p className="text-[11px] text-zinc-500 mt-1">Duyuru metninizi, animasyonunuzu ve renklerinizi dilediğiniz isimle yukarıdaki kutudan şablon olarak kaydedebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-zinc-950/90 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {tpl.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {tpl.animation && tpl.animation !== 'none' && (
                            <span className="text-[9px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded font-mono uppercase">
                              {tpl.animation}
                            </span>
                          )}
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/30" 
                            style={{ backgroundColor: tpl.bgColor || '#121215' }}
                            title="Arka plan rengi"
                          />
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/30" 
                            style={{ backgroundColor: tpl.textColor || '#C5A059' }}
                            title="Yazı rengi"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-300 line-clamp-2 bg-black/40 p-2.5 rounded-lg border border-white/5 font-light">
                        {tpl.text}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={(e) => handleApplyTemplate(tpl, e)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-[#C5A059] text-zinc-200 hover:text-black rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Bu Şablonu Uygula</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Şablonu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#C5A059] font-bold">
                Canlı Mağaza Önizlemesi ({ANIMATION_OPTIONS.find(a => a.id === animation)?.name})
              </label>
              <span className="text-[11px] text-zinc-400">
                {active ? '🟢 Mağazada Görünüyor' : '⚪️ Mağazada Gizli'}
              </span>
            </div>
            
            <div 
              style={{ 
                backgroundColor: bgColor || '#121215', 
                color: textColor || '#C5A059' 
              }}
              className="border border-white/10 rounded-xl py-3 px-4 text-center font-medium shadow-inner transition-colors duration-300 overflow-hidden select-none"
            >
              {animation === 'marquee' ? (
                <div className="w-full overflow-hidden flex items-center">
                  <div 
                    className={`${
                      speed === 'fast' 
                        ? 'animate-marquee-fast' 
                        : speed === 'slow' 
                        ? 'animate-marquee-slow' 
                        : 'animate-marquee-normal'
                    }`}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-6 flex-shrink-0 px-6 text-[11px] uppercase tracking-[0.22em]">
                        <Sparkles 
                          className="w-3.5 h-3.5 flex-shrink-0" 
                          style={{ color: textColor || '#C5A059' }} 
                        />
                        <span>{text || '(Duyuru metni girilmedi)'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div 
                  className={`flex items-center justify-center gap-2.5 text-[11px] uppercase tracking-[0.22em] ${
                    animation === 'pulse' 
                      ? speed === 'fast'
                        ? 'animate-announcement-pulse-fast'
                        : speed === 'slow'
                        ? 'animate-announcement-pulse-slow'
                        : 'animate-announcement-pulse-normal'
                      : animation === 'shimmer'
                      ? 'animate-announcement-shimmer'
                      : animation === 'bounce'
                      ? 'animate-announcement-float'
                      : ''
                  }`}
                >
                  <Sparkles 
                    className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" 
                    style={{ color: textColor || '#C5A059' }} 
                  />
                  <span className="truncate max-w-[85vw] sm:max-w-none">{text || '(Duyuru metni girilmedi)'}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              saveSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black shadow-[#C5A059]/20'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Başarıyla Kaydedildi</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Tüm Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
