"use client";

export default function DashboardLoading() {
    return (
        <div className="w-full h-full space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-surface-muted rounded-md" />
                    <div className="h-4 w-72 bg-surface-muted rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-32 bg-surface-muted rounded-lg" />
                    <div className="h-10 w-40 bg-surface-muted rounded-lg" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-surface-muted rounded-lg" />
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-surface-muted rounded-sm" />
                                <div className="h-6 w-16 bg-surface-muted rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
                <div className="p-4 border-b border-border bg-surface-muted/50 flex justify-between items-center">
                    <div className="h-5 w-32 bg-surface-muted rounded-md" />
                    <div className="h-8 w-64 bg-surface-muted rounded-lg" />
                </div>
                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-surface-muted rounded-full" />
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-surface-muted rounded-md" />
                                    <div className="h-3 w-24 bg-surface-muted rounded-sm" />
                                </div>
                            </div>
                            <div className="h-8 w-24 bg-surface-muted rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
