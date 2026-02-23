"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { ChecklistCategory } from "@/lib/checklist-data";

type Domain = { id: string; name: string; domainUrl: string };

type Props = {
  domains: Domain[];
  categories: ChecklistCategory[];
};

type HoveredSegment = {
  label: string;
  rating: number | null;
  maturityLabel: string;
  isCategory: boolean;
  avgRating: number;
  x: number;
  y: number;
} | null;

function ratingToColor(rating: number | null): string {
  if (rating === null || rating === 0) return "hsl(0 0% 88%)";
  if (rating <= 1) return "hsl(0 72% 51%)";
  if (rating <= 3) return "hsl(25 95% 53%)";
  if (rating <= 5) return "hsl(45 93% 47%)";
  if (rating <= 8) return "hsl(82 78% 55%)";
  return "hsl(142 71% 45%)";
}

function ratingToColorHover(rating: number | null): string {
  if (rating === null || rating === 0) return "hsl(0 0% 78%)";
  if (rating <= 1) return "hsl(0 72% 41%)";
  if (rating <= 3) return "hsl(25 95% 43%)";
  if (rating <= 5) return "hsl(45 93% 37%)";
  if (rating <= 8) return "hsl(82 78% 45%)";
  return "hsl(142 71% 35%)";
}

function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const gap = 0.005;
  const sa = startAngle + gap;
  const ea = endAngle - gap;
  if (ea <= sa) return "";

  const cos1 = Math.cos(sa);
  const sin1 = Math.sin(sa);
  const cos2 = Math.cos(ea);
  const sin2 = Math.sin(ea);

  const largeArc = ea - sa > Math.PI ? 1 : 0;

  const x1o = r(cx + outerR * cos1);
  const y1o = r(cy + outerR * sin1);
  const x2o = r(cx + outerR * cos2);
  const y2o = r(cy + outerR * sin2);
  const x1i = r(cx + innerR * cos2);
  const y1i = r(cy + innerR * sin2);
  const x2i = r(cx + innerR * cos1);
  const y2i = r(cy + innerR * sin1);

  return [
    `M ${x1o} ${y1o}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
    "Z",
  ].join(" ");
}

export function MaturitySunburst({ domains, categories }: Props) {
  const t = useTranslations("Maturity");
  const tc = useTranslations("Checklist");
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    domains[0]?.id ?? ""
  );
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<HoveredSegment>(null);

  const fetchRatings = useCallback(async (domainId: string) => {
    if (!domainId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/maturity-ratings?domainId=${domainId}`);
      if (res.ok) {
        const data = await res.json();
        setRatings(data.ratings ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      fetchRatings(selectedDomainId);
    }
  }, [selectedDomainId, fetchRatings]);

  const getMaturityLabel = (rating: number | null): string => {
    if (rating === null || rating === 0) return t("notRated");
    if (rating <= 1) return t("level_1");
    if (rating <= 3) return t("level_3");
    if (rating <= 5) return t("level_5");
    if (rating <= 8) return t("level_8");
    return t("level_10");
  };

  const totalItems = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.items.length, 0),
    [categories]
  );

  const cx = 300;
  const cy = 300;
  const centerR = 38;
  const catInnerR = 45;
  const catOuterR = 155;
  const itemInnerR = 160;
  const itemOuterR = 270;

  const sunburstData = useMemo(() => {
    let currentAngle = -Math.PI / 2;
    const fullCircle = 2 * Math.PI;

    return categories.map((cat) => {
      const catAngleSize = (cat.items.length / totalItems) * fullCircle;
      const catStart = currentAngle;
      const catEnd = currentAngle + catAngleSize;

      const catRatings = cat.items
        .map((item) => ratings[item.key])
        .filter((r): r is number => r != null);
      const catAvg =
        catRatings.length > 0
          ? catRatings.reduce((a, b) => a + b, 0) / catRatings.length
          : 0;

      const itemAngleSize = catAngleSize / cat.items.length;
      const items = cat.items.map((item, idx) => {
        const itemStart = catStart + idx * itemAngleSize;
        const itemEnd = itemStart + itemAngleSize;
        const r = ratings[item.key] ?? null;
        return {
          key: item.key,
          label: tc(item.labelKey),
          startAngle: itemStart,
          endAngle: itemEnd,
          rating: r,
          color: ratingToColor(r),
          colorHover: ratingToColorHover(r),
        };
      });

      currentAngle = catEnd;

      return {
        id: cat.id,
        label: tc(cat.titleKey),
        startAngle: catStart,
        endAngle: catEnd,
        avgRating: catAvg,
        color: ratingToColor(catAvg > 0 ? catAvg : null),
        colorHover: ratingToColorHover(catAvg > 0 ? catAvg : null),
        items,
      };
    });
  }, [categories, totalItems, ratings, tc]);

  const overallAvg = useMemo(() => {
    const allRated = Object.values(ratings);
    if (allRated.length === 0) return 0;
    return allRated.reduce((a, b) => a + b, 0) / allRated.length;
  }, [ratings]);

  const ratedCount = Object.keys(ratings).length;

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("noDomains")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={t("selectDomain")} />
          </SelectTrigger>
          <SelectContent>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} ({d.domainUrl})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {ratedCount} / {totalItems} {t("rated")}
          </span>
          {overallAvg > 0 && (
            <span className="font-semibold text-foreground">
              {t("avgLabel")}: {overallAvg.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-full">
            <svg
              viewBox="0 0 600 600"
              className="mx-auto h-auto w-full"
            >
              {/* Center circle */}
              <circle
                cx={cx}
                cy={cy}
                r={centerR}
                className="fill-primary/10 stroke-primary/30"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-bold"
              >
                Visibility
              </text>
              {overallAvg > 0 && (
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  ø {overallAvg.toFixed(1)}
                </text>
              )}

              {/* Category ring */}
              {sunburstData.map((cat) => (
                <path
                  key={`cat-${cat.id}`}
                  d={describeArc(
                    cx,
                    cy,
                    catInnerR,
                    catOuterR,
                    cat.startAngle,
                    cat.endAngle
                  )}
                  fill={
                    hovered?.label === cat.label
                      ? cat.colorHover
                      : cat.color
                  }
                  className="cursor-pointer stroke-background transition-colors duration-150"
                  strokeWidth={1.5}
                  onMouseMove={(e) =>
                    setHovered({
                      label: cat.label,
                      rating: null,
                      maturityLabel: getMaturityLabel(
                        cat.avgRating > 0 ? cat.avgRating : null
                      ),
                      isCategory: true,
                      avgRating: cat.avgRating,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                />
              ))}

              {/* Category labels on the ring */}
              {sunburstData.map((cat) => {
                const midAngle =
                  (cat.startAngle + cat.endAngle) / 2;
                const labelR = (catInnerR + catOuterR) / 2;
                const lx = r(cx + labelR * Math.cos(midAngle));
                const ly = r(cy + labelR * Math.sin(midAngle));
                const angleDeg = r((midAngle * 180) / Math.PI);
                const flip =
                  angleDeg > 90 || angleDeg < -90;
                const rotation = r(flip
                  ? angleDeg + 180
                  : angleDeg);

                return (
                  <text
                    key={`cat-label-${cat.id}`}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${rotation}, ${lx}, ${ly})`}
                    className="pointer-events-none fill-foreground text-[7px] font-medium"
                  >
                    {cat.label.length > 22
                      ? cat.label.slice(0, 20) + "…"
                      : cat.label}
                  </text>
                );
              })}

              {/* Item ring */}
              {sunburstData.flatMap((cat) =>
                cat.items.map((item) => (
                  <path
                    key={`item-${item.key}`}
                    d={describeArc(
                      cx,
                      cy,
                      itemInnerR,
                      itemOuterR,
                      item.startAngle,
                      item.endAngle
                    )}
                    fill={
                      hovered?.label === item.label
                        ? item.colorHover
                        : item.color
                    }
                    className="cursor-pointer stroke-background transition-colors duration-150"
                    strokeWidth={1}
                    onMouseMove={(e) =>
                      setHovered({
                        label: item.label,
                        rating: item.rating,
                        maturityLabel: getMaturityLabel(item.rating),
                        isCategory: false,
                        avgRating: item.rating ?? 0,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseLeave={() => setHovered(null)}
                  />
                ))
              )}

              {/* Item labels */}
              {sunburstData.flatMap((cat) =>
                cat.items.map((item) => {
                  const midAngle =
                    (item.startAngle + item.endAngle) / 2;
                  const labelR = (itemInnerR + itemOuterR) / 2;
                  const lx = r(cx + labelR * Math.cos(midAngle));
                  const ly = r(cy + labelR * Math.sin(midAngle));
                  const angleDeg = r((midAngle * 180) / Math.PI);
                  const flip =
                    angleDeg > 90 || angleDeg < -90;
                  const rotation = r(flip
                    ? angleDeg + 180
                    : angleDeg);

                  const segAngle = item.endAngle - item.startAngle;
                  const maxChars = Math.max(3, Math.floor(segAngle * 140));
                  const displayText =
                    item.label.length > maxChars
                      ? item.label.slice(0, maxChars - 1) + "…"
                      : item.label;

                  return (
                    <text
                      key={`item-label-${item.key}`}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${rotation}, ${lx}, ${ly})`}
                      className="pointer-events-none fill-foreground/80 text-[5px]"
                    >
                      {displayText}
                    </text>
                  );
                })
              )}
            </svg>
          </div>

          {/* Floating tooltip at cursor */}
          {hovered && (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border bg-popover px-3 py-2 shadow-lg"
              style={{
                left: hovered.x + 12,
                top: hovered.y + 12,
              }}
            >
              <p className="text-sm font-semibold">{hovered.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  {hovered.isCategory
                    ? hovered.avgRating > 0
                      ? hovered.avgRating.toFixed(1)
                      : "–"
                    : hovered.rating ?? "–"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hovered.maturityLabel}
                </span>
              </div>
            </div>
          )}

          {/* Legend below the chart */}
          <div className="w-full">
            {/* Legend */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("legend")}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {[
                    { label: t("level_1"), color: "bg-red-500", range: "1" },
                    {
                      label: t("level_3"),
                      color: "bg-orange-400",
                      range: "2–3",
                    },
                    {
                      label: t("level_5"),
                      color: "bg-amber-400",
                      range: "4–5",
                    },
                    {
                      label: t("level_8"),
                      color: "bg-lime-500",
                      range: "6–8",
                    },
                    {
                      label: t("level_10"),
                      color: "bg-green-500",
                      range: "9–10",
                    },
                    {
                      label: t("notRated"),
                      color: "bg-muted",
                      range: "–",
                    },
                  ].map((item) => (
                    <div
                      key={item.range}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className={`h-3 w-3 shrink-0 rounded-sm ${item.color}`}
                      />
                      <span className="text-muted-foreground tabular-nums">
                        {item.range}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
