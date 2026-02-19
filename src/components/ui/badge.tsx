import { cn } from "@/lib/utils";

type BadgeVariant = "goal" | "concern" | "action" | "habit" | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  goal: "bg-emerald-100 text-emerald-800",
  concern: "bg-amber-100 text-amber-800",
  action: "bg-blue-100 text-blue-800",
  habit: "bg-purple-100 text-purple-800",
  default: "bg-secondary text-secondary-foreground",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
