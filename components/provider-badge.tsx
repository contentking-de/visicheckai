import Image from "next/image";
import { PROVIDER_LABELS, PROVIDER_ICONS } from "@/lib/providers";
import { Badge } from "@/components/ui/badge";

export function ProviderBadge({
  provider,
  variant = "outline",
  className = "",
  showLabel = true,
}: {
  provider: string;
  variant?: "outline" | "secondary" | "default" | "destructive";
  className?: string;
  showLabel?: boolean;
}) {
  const icon = PROVIDER_ICONS[provider];
  const label = PROVIDER_LABELS[provider] ?? provider;

  return (
    <Badge variant={variant} className={`inline-flex items-center gap-1.5 text-xs font-normal ${className}`}>
      {icon && (
        <Image src={icon} alt={label} width={14} height={14} className="h-3.5 w-3.5" />
      )}
      {showLabel && label}
    </Badge>
  );
}

export function ProviderIcon({
  provider,
  size = 16,
  className = "",
}: {
  provider: string;
  size?: number;
  className?: string;
}) {
  const icon = PROVIDER_ICONS[provider];
  const label = PROVIDER_LABELS[provider] ?? provider;

  if (!icon) return null;

  return (
    <Image
      src={icon}
      alt={label}
      width={size}
      height={size}
      className={className || `h-${size / 4} w-${size / 4}`}
      style={{ width: size, height: size }}
    />
  );
}
