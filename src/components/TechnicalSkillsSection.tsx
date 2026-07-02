"use client";

import { useState } from "react";
import StarRating from "./StarRating";

export default function TechnicalSkillsSection({
  positionGroups,
  skillsByGroup,
  defaultGroup,
  defaultRatings,
}: {
  positionGroups: [string, string][];
  skillsByGroup: Record<string, [string, string][]>;
  defaultGroup: string;
  defaultRatings: Record<string, number>;
}) {
  const [group, setGroup] = useState(defaultGroup);
  const skills = skillsByGroup[group] ?? [];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm" style={{ color: "var(--navy)" }}>
          פרמטרים טכניים-טקטיים לפי תפקיד
        </h3>
        <select name="positionGroup" value={group} onChange={(e) => setGroup(e.target.value)} className="input w-40">
          {positionGroups.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2.5">
        {skills.map(([key, label]) => (
          <StarRating key={key} name={key} label={label} defaultValue={defaultRatings[key] ?? null} />
        ))}
      </div>
    </div>
  );
}
