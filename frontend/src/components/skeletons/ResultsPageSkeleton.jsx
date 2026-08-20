import React from "react";
import BaseSkeleton from "./BaseSkeleton";

/**
 * 1. Results Header Skeleton
 */
export function ResultsHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <BaseSkeleton className="h-9 w-40 sm:w-48" />
      <BaseSkeleton className="h-4 w-60 sm:w-80" />
    </div>
  );
}

/**
 * 2. Results 4-Stats Grid Skeleton
 */
export function ResultsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <BaseSkeleton className="h-3.5 w-24" />
            <BaseSkeleton className="h-7 w-16" />
          </div>
          <BaseSkeleton className="w-10 h-10 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * 3. Search & Filter Bar Skeleton
 */
export function ResultsSearchAndFilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <BaseSkeleton className="h-11 flex-1 rounded-xl" />
      <BaseSkeleton className="h-11 w-full sm:w-48 rounded-xl" />
    </div>
  );
}

/**
 * 4. Results Table Rows Skeleton
 */
export function ResultsTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <BaseSkeleton className="h-4 w-28" />
        <BaseSkeleton className="h-4 w-16" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between">
            <div className="space-y-1.5 flex-1 pr-4">
              <BaseSkeleton className="h-5 w-44 sm:w-64" />
              <div className="flex items-center gap-3">
                <BaseSkeleton className="h-3 w-20" />
                <BaseSkeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <BaseSkeleton className="h-6 w-16 rounded-full" />
              <BaseSkeleton className="h-6 w-12" />
              <BaseSkeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Results Page Skeleton Assembly
 */
export function ResultsPageSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fade-in">
      <ResultsHeaderSkeleton />
      <ResultsStatsSkeleton />
      <ResultsSearchAndFilterSkeleton />
      <ResultsTableSkeleton />
    </div>
  );
}

export default ResultsPageSkeleton;
