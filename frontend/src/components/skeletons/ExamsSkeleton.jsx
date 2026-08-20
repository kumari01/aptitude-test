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
 * 4. Admin Exams Header Skeleton
 */
export function AdminExamsHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="space-y-2">
        <BaseSkeleton className="h-9 w-64 sm:w-80" />
        <BaseSkeleton className="h-4 w-72 sm:w-96" />
      </div>
      <BaseSkeleton className="h-11 w-48 rounded-xl shrink-0" />
    </div>
  );
}

/**
 * 5. Admin Workflow Banner Skeleton (4 Connected Pipeline Steps)
 */
export function AdminWorkflowBannerSkeleton() {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <BaseSkeleton isDark className="h-6 w-56" />
          <BaseSkeleton isDark className="h-4 w-72 sm:w-96" />
        </div>
        <BaseSkeleton isDark className="h-9 w-36 rounded-xl" />
      </div>

      {/* 4 Pipeline Step Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/80 rounded-2xl p-4 space-y-3 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <BaseSkeleton isDark className="w-7 h-7 rounded-full" />
              <BaseSkeleton isDark className="h-4 w-12 rounded-full" />
            </div>
            <BaseSkeleton isDark className="h-4 w-3/4" />
            <BaseSkeleton isDark className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Admin Single Exam Item Row Skeleton
 */
export function AdminExamItemCardSkeleton() {
  return (
    <div className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-2.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <BaseSkeleton className="h-5 w-20 rounded-full" />
          <BaseSkeleton className="h-5 w-24 rounded-full" />
        </div>
        <BaseSkeleton className="h-6 w-3/5" />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <BaseSkeleton className="h-3.5 w-28" />
          <BaseSkeleton className="h-3.5 w-24" />
          <BaseSkeleton className="h-3.5 w-28" />
          <BaseSkeleton className="h-3.5 w-32" />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <BaseSkeleton className="h-9 w-32 rounded-xl" />
        <BaseSkeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 7. Complete Admin Exams Page Skeleton Assembly
 */
export function AdminExamsSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      <AdminExamsHeaderSkeleton />
      <AdminWorkflowBannerSkeleton />

      {/* Outer List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <BaseSkeleton className="h-6 w-60" />
            <BaseSkeleton className="h-3.5 w-80 sm:w-96" />
          </div>
          <BaseSkeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((i) => (
            <AdminExamItemCardSkeleton key={i} />
          ))}
        </div>
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
