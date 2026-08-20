import React from "react";
import BaseSkeleton from "./BaseSkeleton";

/**
 * 1. Top Return Button Skeleton
 */
export function ExamResultReturnButtonSkeleton() {
  return (
    <div className="mb-4">
      <BaseSkeleton className="h-9 w-44 rounded-xl" />
    </div>
  );
}

/**
 * 2. Primary Score Card Skeleton (Pass/Fail banner, Percentage gauge, 3 metric cards)
 */
export function ExamResultScoreCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Top Header Badge & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <BaseSkeleton className="h-4 w-28 rounded-md" />
          <BaseSkeleton className="h-8 w-60 sm:w-80" />
        </div>
        <BaseSkeleton className="h-8 w-28 rounded-full shrink-0" />
      </div>

      {/* Center Big Score & Percentage Bar */}
      <div className="bg-gray-50/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100">
        <div className="space-y-2 text-center sm:text-left">
          <BaseSkeleton className="h-4 w-32 mx-auto sm:mx-0" />
          <BaseSkeleton className="h-10 w-24 mx-auto sm:mx-0" />
          <BaseSkeleton className="h-3 w-40 mx-auto sm:mx-0" />
        </div>
        <BaseSkeleton className="w-24 h-24 rounded-full shrink-0" />
      </div>

      {/* 3 Metric Pills: Correct, Wrong, Skipped */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center space-y-2 border border-gray-100">
            <BaseSkeleton className="w-6 h-6 rounded-full mx-auto" />
            <BaseSkeleton className="h-6 w-12 mx-auto" />
            <BaseSkeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. Filter Tabs Skeleton
 */
export function ExamResultFilterTabsSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((i) => (
        <BaseSkeleton key={i} className="h-9 w-24 sm:w-28 rounded-xl shrink-0" />
      ))}
    </div>
  );
}

/**
 * 4. Question Review Item Skeleton
 */
export function ExamResultQuestionReviewSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <BaseSkeleton className="h-5 w-28 rounded-lg" />
            <BaseSkeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Question Prompt */}
          <BaseSkeleton className="h-5 w-4/5" />

          {/* Options Grid */}
          <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
            {[1, 2, 3, 4].map((opt) => (
              <BaseSkeleton key={opt} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Complete Exam Result Page Skeleton Assembly
 */
export function ExamResultSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <ExamResultReturnButtonSkeleton />
      <ExamResultScoreCardSkeleton />
      <ExamResultFilterTabsSkeleton />
      <ExamResultQuestionReviewSkeleton />
    </div>
  );
}

export default ExamResultSkeleton;
