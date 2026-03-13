import { CompanyStatus, COMPANY_STATUS_COLORS, COMPANY_STATUS_LABELS } from "@/types";

interface StatusBadgeProps {
  status: CompanyStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COMPANY_STATUS_COLORS[status]} ${className}`}
    >
      {COMPANY_STATUS_LABELS[status]}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
