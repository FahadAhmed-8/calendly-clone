"use client";

import { Icon } from "@/components/ui/Icon";

interface BookingHeaderCardProps {
  hostName: string;
  hostAvatarUrl?: string;
  eventName: string;
  durationMinutes: number;
  description?: string;
}

export function BookingHeaderCard({
  hostName,
  hostAvatarUrl,
  eventName,
  durationMinutes,
  description,
}: BookingHeaderCardProps) {
  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar and name */}
      <div className="flex flex-col gap-4">
        {hostAvatarUrl ? (
          <img
            alt={hostName}
            src={hostAvatarUrl}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-xl font-bold text-on-primary">{getInitial(hostName)}</span>
          </div>
        )}
        <div>
          <h2 className="text-on-surface-variant font-medium text-sm">{hostName}</h2>
          <h1 className="text-on-surface text-xl font-bold tracking-tight mt-1">{eventName}</h1>
        </div>
      </div>

      {/* Duration and video conferencing info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Icon name="schedule" className="text-xl" />
          <span className="text-sm font-medium">{durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Icon name="videocam" className="text-xl" />
          <span className="text-sm font-medium">Web conferencing details provided upon confirmation.</span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
}
