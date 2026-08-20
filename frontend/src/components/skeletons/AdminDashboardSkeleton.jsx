import React from "react";
import BaseSkeleton from "./BaseSkeleton";

/**
 * 1. Admin Dashboard Header Skeleton
 */
export function AdminDashboardHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <BaseSkeleton className="h-8 w-64 sm:w-80" />
      <BaseSkeleton className="h-4 w-72 sm:w-96" />
    </div>
  );
}

/**
 * 2. Admin 4-KPI Stats Grid Skeleton
 */
export function AdminDashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2"
        >
          <BaseSkeleton className="h-3.5 w-24" />
          <BaseSkeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * 3. Weekly Exam Cards Grid Skeleton
 */
export function AdminWeeklyCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-6 w-48" />
        <BaseSkeleton className="h-4 w-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <BaseSkeleton className="h-5 w-20 rounded-full" />
                <BaseSkeleton className="h-5 w-24 rounded-full" />
              </div>
              <BaseSkeleton className="h-6 w-4/5" />
              <BaseSkeleton className="h-3 w-1/2" />

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <BaseSkeleton className="h-12 rounded-xl" />
                <BaseSkeleton className="h-12 rounded-xl" />
                <BaseSkeleton className="h-12 rounded-xl" />
              </div>
            </div>

            <BaseSkeleton className="h-10 w-full rounded-xl mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Drilldown Student Telemetry Table Skeleton
 */
export function AdminDrilldownSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseSkeleton className="h-10 w-44 rounded-xl" />
        <BaseSkeleton className="h-6 w-32 rounded-full" />
      </div>

      {/* 4 Exam-Specific Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
            <BaseSkeleton className="h-3 w-20" />
            <BaseSkeleton className="h-6 w-14" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <BaseSkeleton className="h-10 flex-1 rounded-xl" />
        <BaseSkeleton className="h-10 w-full sm:w-64 rounded-xl" />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <BaseSkeleton className="h-4 w-32" />
          <BaseSkeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between">
              <div className="space-y-1.5 flex-1 pr-4">
                <BaseSkeleton className="h-4 w-36 sm:w-48" />
                <BaseSkeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <BaseSkeleton className="h-4 w-16" />
                <BaseSkeleton className="h-6 w-20 rounded-full" />
                <BaseSkeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Admin Dashboard Skeleton
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="px-3 sm:px-5 lg:px-6 py-4 w-full space-y-5 animate-fade-in">
      <AdminDashboardHeaderSkeleton />
      <AdminDashboardStatsSkeleton />
      <AdminWeeklyCardsSkeleton />
    </div>
  );
}

export default AdminDashboardSkeleton;
