import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-sans-hebrew/400.css";
import "@fontsource/ibm-plex-sans-hebrew/500.css";
import "@fontsource/ibm-plex-sans-hebrew/600.css";
import "@fontsource/ibm-plex-sans-hebrew/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { getRequestLinkByToken } from "@/lib/request-links";
import { DEFAULT_CONTACT } from "@/lib/proposal";
import PublicRequestForm from "@/components/request/PublicRequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VERA · בקשת שחקן",
  robots: { index: false, follow: false },
};

// Public, no-login page. The token in the URL is the only credential: an
// unknown token is a plain 404, an inactive one shows a short message.
export default async function PublicRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getRequestLinkByToken(token);
  if (!found) notFound();

  const { link, club, contact } = found;
  return (
    <PublicRequestForm
      token={token}
      active={link.active}
      club={club ? { name: club.name } : null}
      contact={contact ? { name: contact.name, role: contact.role, phone: contact.phone } : null}
      contactName={link.contactName}
      agentName={DEFAULT_CONTACT.name}
    />
  );
}
