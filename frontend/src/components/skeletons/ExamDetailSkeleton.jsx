import React from "react";
import BaseSkeleton from "./BaseSkeleton";

/**
 * 1. Back Button Skeleton
 */
export function ExamDetailBackButtonSkeleton() {
  return (
    <div className="mb-6">
      <BaseSkeleton className="h-4 w-28" />
    </div>
  );
}

/**
 * 2. Main Overview Card Skeleton (Badges, Title, 4 Stat Boxes)
 */
export function ExamDetailOverviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm space-y-6">
      {/* Top Badges */}
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-4 w-20 rounded-md" />
        <BaseSkeleton className="h-6 w-48 rounded-full" />
      </div>

      {/* Main Title */}
      <BaseSkeleton className="h-9 w-3/4 max-w-lg" />

      {/* 4 Summary Metric Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl py-5 px-3 text-center space-y-2">
            <BaseSkeleton className="w-6 h-6 rounded-md mx-auto" />
            <BaseSkeleton className="h-6 w-12 mx-auto" />
            <BaseSkeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. Exam Sections Skeleton
 */
export function ExamDetailSectionsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm space-y-4">
      <BaseSkeleton className="h-7 w-40" />
      <div className="grid sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 border border-gray-100 bg-gray-50 rounded-xl space-y-2">
            <BaseSkeleton className="h-5 w-32" />
            <BaseSkeleton className="h-3 w-24" />
            <BaseSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Instructions List Skeleton
 */
export function ExamDetailInstructionsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm space-y-4">
      <BaseSkeleton className="h-7 w-36" />
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <BaseSkeleton className="w-4 h-4 rounded-full shrink-0" />
            <BaseSkeleton className={`h-4 ${i % 2 === 0 ? "w-4/5" : "w-11/12"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Bottom Action Button Skeleton
 */
export function ExamDetailActionSkeleton() {
  return (
    <div>
      <BaseSkeleton className="h-12 w-44 rounded-xl" />
    </div>
  );
}

/**
 * Complete Exam Detail Page Skeleton Assembly
 */
export function ExamDetailSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto animate-fade-in">
      <ExamDetailBackButtonSkeleton />
      <ExamDetailOverviewSkeleton />
      <ExamDetailInstructionsSkeleton />
      <ExamDetailActionSkeleton />
    </div>
  );
}

export default ExamDetailSkeleton;
