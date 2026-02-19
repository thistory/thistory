import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  className?: string;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const colors = [
  "bg-amber-200 text-amber-800",
  "bg-emerald-200 text-emerald-800",
  "bg-blue-200 text-blue-800",
  "bg-purple-200 text-purple-800",
  "bg-rose-200 text-rose-800",
  "bg-teal-200 text-teal-800",
];

function Avatar({ name, className }: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex = hashCode(name) % colors.length;

  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
        colors[colorIndex],
        className
      )}
    >
      {initials}
    </div>
  );
}

export { Avatar };
export type { AvatarProps };
