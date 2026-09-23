"use client";

import { Icon } from "./icons";
import { usePrefs } from "./providers/prefs";

export function TestnetBanner() {
  const { bannerHidden, hideBanner } = usePrefs();
  if (bannerHidden) return null;
  return (
    <div className="banner" role="note">
      <Icon name="flask" size={16} />
      <span>Testnet preview: no real funds</span>
      <button className="iconbtn" type="button" aria-label="Dismiss testnet notice" onClick={hideBanner}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
