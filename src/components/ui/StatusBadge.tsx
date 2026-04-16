import { CompanyStatus, COMPANY_STATUS_COLORS, COMPANY_STATUS_LABELS } from "@/types";

interface StatusBadgeProps {
  status: CompanyStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COMPANY_STATUS_COLORS[status]} ${className}`}
    >
      {label ?? COMPANY_STATUS_LABELS[status]}
    </span>
  );
}

interface LegacyBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
};

export function LegacyBadge({ children, variant = "default", className = "" }: LegacyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
