"use client";

export default function AutoSubmitCheckbox({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  return (
    <input
      type="checkbox"
      name={name}
      defaultChecked={defaultChecked}
      className="w-4 h-4"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}
