import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Megaphone, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { HeroBanner } from '../../types';
import { BannerManager } from './BannerManager';
import { AnnouncementManager } from './AnnouncementManager';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface BannerAndAnnouncementManagerProps {
  banners: HeroBanner[];
  initialSubTab?: 'banners' | 'announcement';
}

export const BannerAndAnnouncementManager: React.FC<BannerAndAnnouncementManagerProps> = ({
  banners,
  initialSubTab = 'banners'
}) => {
  const [subTab, setSubTab] = useState<'banners' | 'announcement'>(initialSubTab);
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const activeBannersCount = banners.filter(b => b.active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-sans text-base sm:text-lg text-white font-bold tracking-wide">
              Vitrin & Duyuru Yönetimi
            </h2>
            <p className="text-xs text-zinc-400 font-light">
              Ana sayfa hero slaytlarını ve mağaza üst duyuru bandını tek merkezden yönetin
            </p>
          </div>
        </div>

        {/* Pill-style Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('banners')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              subTab === 'banners'
                ? 'bg-[#C5A059] text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Hero Slider ({banners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('announcement')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              subTab === 'announcement'
                ? 'bg-[#C5A059] text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Duyuru Bandı</span>
            <span 
              className={`w-2 h-2 rounded-full ${
                settings.announcementActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`} 
              title={settings.announcementActive ? 'Yayında' : 'Gizli'}
            />
          </button>
        </div>
      </div>

      {/* Sub-tab view */}
      <div>
        {subTab === 'banners' && (
          <BannerManager banners={banners} />
        )}

        {subTab === 'announcement' && (
          <AnnouncementManager />
        )}
      </div>
    </div>
  );
};
