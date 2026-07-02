"use client";

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  doubleConfirm,
  className,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  doubleConfirm?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className ?? "btn btn-danger btn-sm"}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        if (doubleConfirm && !confirm("לאישור סופי: האם אתה בטוח לחלוטין? הפעולה בלתי הפיכה.")) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
