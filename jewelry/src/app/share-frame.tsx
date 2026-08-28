import Image from "next/image";
import type { Settings } from "@/lib/data";

/** המסגרת של כל עמוד שנשלח החוצה: לוגו, תוכן, וכותרת תחתונה. */
export default function ShareFrame({
  settings,
  children,
}: {
  settings: Settings;
  children: React.ReactNode;
}) {
  return (
    <div className="share">
      <header className="share-head">
        <Image
          src="/brand/samuel-logo.png"
          alt={settings.businessName}
          width={336}
          height={106}
          className="logo"
          priority
        />
      </header>

      {children}

      <footer className="share-foot">
        <span>{settings.businessName}</span>
        {settings.instagramHandle ? <span dir="ltr">{settings.instagramHandle}</span> : null}
        {settings.whatsappNumber ? <span dir="ltr">{settings.whatsappNumber}</span> : null}
      </footer>
    </div>
  );
}
