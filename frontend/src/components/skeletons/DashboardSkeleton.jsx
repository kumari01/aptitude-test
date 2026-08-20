import React from "react";
import BaseSkeleton from "./BaseSkeleton";
import { INK } from "../../constants/theme";

/**
 * 1. Greeting & Title Header Skeleton
 */
export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <BaseSkeleton className="h-9 w-64 sm:w-80" />
      <BaseSkeleton className="h-4 w-44 sm:w-56" />
    </div>
  );
}

/**
 * 2. Featured Live Exam Banner Skeleton
 */
export function DashboardBannerSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6 shadow-sm relative overflow-hidden"
      style={{ background: INK }}
    >
      <div className="space-y-4 w-full sm:w-auto flex-1">
        {/* Status Tag & Subtitle */}
        <div className="flex items-center gap-3">
          <BaseSkeleton dark className="h-5 w-20 rounded-full" />
          <BaseSkeleton dark className="h-4 w-28" />
        </div>

        {/* Big Exam Title */}
        <BaseSkeleton dark className="h-8 w-3/4 max-w-md" />

        {/* Metadata badges (Questions, Duration, Due Date) */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
          <BaseSkeleton dark className="h-4 w-24" />
          <BaseSkeleton dark className="h-4 w-24" />
          <BaseSkeleton dark className="h-4 w-28" />
        </div>
      </div>

      {/* Action Button */}
      <BaseSkeleton dark className="h-12 w-full sm:w-36 rounded-xl shrink-0" />
    </div>
  );
}

/**
 * 3. 4-Grid Stat Cards Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <BaseSkeleton className="h-3.5 w-20" />
            <BaseSkeleton className="h-7 w-16" />
          </div>
          <BaseSkeleton className="w-10 h-10 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * 4. Leaderboard Card Skeleton
 */
export function DashboardLeaderboardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      {/* Header with Title and Dropdown Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-1.5">
          <BaseSkeleton className="h-6 w-32" />
          <BaseSkeleton className="h-3 w-40" />
        </div>
        <BaseSkeleton className="h-9 w-44 rounded-xl" />
      </div>

      {/* Student List Rows */}
      <div className="space-y-2 pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50/60"
          >
            <div className="flex items-center gap-3">
              <BaseSkeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="space-y-1">
                <BaseSkeleton className="h-4 w-28 sm:w-36" />
                <BaseSkeleton className="h-3 w-20" />
              </div>
            </div>
            <BaseSkeleton className="h-5 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Recent Attempts Card Skeleton
 */
export function DashboardRecentAttemptsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <BaseSkeleton className="h-6 w-36" />
      </div>

      {/* List Items */}
      <div className="space-y-4 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <BaseSkeleton className="h-4 w-32 sm:w-40" />
              <BaseSkeleton className="h-3 w-20" />
            </div>
            <div className="space-y-1 text-right flex flex-col items-end">
              <BaseSkeleton className="h-4 w-12" />
              <BaseSkeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Dashboard Page Skeleton Assembly
 */
export function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fade-in">
      <DashboardHeaderSkeleton />
      <DashboardBannerSkeleton />
      <DashboardStatsSkeleton />

      {/* Grid for Leaderboard & Recent Attempts */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <DashboardLeaderboardSkeleton />
        <DashboardRecentAttemptsSkeleton />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
