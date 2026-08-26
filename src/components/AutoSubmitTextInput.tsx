"use client";

export default function AutoSubmitTextInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="input"
      style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
