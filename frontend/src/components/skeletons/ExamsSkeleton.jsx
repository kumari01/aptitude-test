import React from "react";
import BaseSkeleton from "./BaseSkeleton";

/**
 * 1. Exams Header Skeleton
 */
export function ExamsHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <BaseSkeleton className="h-9 w-64 sm:w-80" />
      <BaseSkeleton className="h-4 w-52 sm:w-96" />
    </div>
  );
}

/**
 * 2. Student Single Exam Card Skeleton
 */
export function StudentExamCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-5 w-24 rounded-full" />
          <BaseSkeleton className="h-5 w-32 rounded-full" />
        </div>

        {/* Exam Title */}
        <BaseSkeleton className="h-6 w-3/4" />

        {/* Meta Info (Questions, Time, Tabs) */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <BaseSkeleton className="h-4 w-24" />
          <BaseSkeleton className="h-4 w-24" />
          <BaseSkeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Button */}
      <BaseSkeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

/**
 * 3. Student Assigned Exams Grid Skeleton
 */
export function StudentExamsSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fade-in">
      <ExamsHeaderSkeleton />
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StudentExamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Admin Management Page Skeleton
 */
export function AdminExamsSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <BaseSkeleton className="h-9 w-64" />
          <BaseSkeleton className="h-4 w-80" />
        </div>
        <BaseSkeleton className="h-11 w-44 rounded-xl shrink-0" />
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
            <BaseSkeleton className="h-3.5 w-24" />
            <BaseSkeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Admin Exam Rows / Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <BaseSkeleton className="h-5 w-20 rounded-full" />
                  <BaseSkeleton className="h-5 w-24 rounded-full" />
                </div>
                <BaseSkeleton className="h-6 w-1/2" />
                <div className="flex items-center gap-4">
                  <BaseSkeleton className="h-4 w-24" />
                  <BaseSkeleton className="h-4 w-28" />
                  <BaseSkeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BaseSkeleton className="h-9 w-20 rounded-xl" />
                <BaseSkeleton className="h-9 w-24 rounded-xl" />
                <BaseSkeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Universal Exams Skeleton
 */
export function ExamsSkeleton({ isAdmin = false }) {
  return isAdmin ? <AdminExamsSkeleton /> : <StudentExamsSkeleton />;
}

export default ExamsSkeleton;
