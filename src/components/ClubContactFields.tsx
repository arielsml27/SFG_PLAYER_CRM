import {
  RELATIONSHIP_LEVELS,
  RELATIONSHIP_LEVEL_LABELS,
  RELATIONSHIP_OWNERS,
  RELATIONSHIP_OWNER_LABELS,
} from "@/lib/constants";

type ClubContactDefaults = {
  name?: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  relationshipLevel?: number | null;
  relationshipOwner?: string | null;
  lastContactAt?: string | null;
};

// Shared field set for the club contact add / edit forms. Renders into the
// parent's two-column grid, so the parent owns the <form> and the submit button.
export default function ClubContactFields({ defaultValues }: { defaultValues?: ClubContactDefaults }) {
  return (
    <>
      <div>
        <label className="field-label">שם *</label>
        <input name="name" required defaultValue={defaultValues?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">תפקיד</label>
        <input name="role" defaultValue={defaultValues?.role ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">טלפון</label>
        <input name="phone" defaultValue={defaultValues?.phone ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">אימייל</label>
        <input name="email" defaultValue={defaultValues?.email ?? ""} className="input" />
      </div>
      <div>
        <label className="field-label">רמת קשר</label>
        <select name="relationshipLevel" defaultValue={defaultValues?.relationshipLevel?.toString() ?? ""} className="input">
          <option value="">לא הוגדר</option>
          {RELATIONSHIP_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} · {RELATIONSHIP_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">הקשר של</label>
        <select name="relationshipOwner" defaultValue={defaultValues?.relationshipOwner ?? ""} className="input">
          <option value="">לא הוגדר</option>
          {RELATIONSHIP_OWNERS.map((o) => (
            <option key={o} value={o}>
              {RELATIONSHIP_OWNER_LABELS[o]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">מגע אחרון</label>
        <input name="lastContactAt" type="date" defaultValue={defaultValues?.lastContactAt ?? ""} className="input" />
      </div>
    </>
  );
}
