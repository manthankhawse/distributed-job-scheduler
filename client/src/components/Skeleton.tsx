
// --- 1. The Base Atom (Pulsing Box) ---
export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
}

// --- 2. Dashboard Page Skeleton ---
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                {/* Stats Grid (3 cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-32 flex justify-between relative overflow-hidden">
                                <div className="space-y-4 z-10">
                                <Skeleton className="h-4 w-24 bg-gray-100" />
                                <Skeleton className="h-10 w-16 bg-gray-100" />
                                </div>
                                <Skeleton className="h-10 w-10 rounded-lg bg-gray-100" />
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Header Row Mimic */}
                        <div className="flex justify-between pb-4 border-b border-gray-50">
                            <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-10" />
                        </div>
                        {/* Data Rows Mimic */}
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <Skeleton className="h-4 w-20 font-mono" /> {/* ID */}
                                <Skeleton className="h-4 w-32" /> {/* Name */}
                                <Skeleton className="h-6 w-16 rounded bg-gray-100" /> {/* Runtime Badge */}
                                <Skeleton className="h-6 w-24 rounded-full bg-gray-100" /> {/* Status Badge */}
                                <Skeleton className="h-4 w-32" /> {/* Date */}
                                <Skeleton className="h-4 w-16 text-right" /> {/* Action Link */}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 3. Job Details Page Skeleton ---
export function JobDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Skeleton (History list) */}
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-20 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Main Content Skeleton (Status + Terminal) */}
                    <div className="lg:col-span-3 space-y-6">
                         {/* Tabs Mimic */}
                        <div className="flex gap-4 border-b border-gray-200 pb-4">
                             <Skeleton className="h-6 w-24" />
                             <Skeleton className="h-6 w-24" />
                             <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-32 w-full rounded-xl" /> {/* Status Card */}
                        <Skeleton className="h-[400px] w-full rounded-xl bg-gray-800" /> {/* Terminal */}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 4. Run Analysis Page Skeleton ---
export function RunSkeleton() {
    return (
            <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-10 rounded-full" /> {/* Back Arrow */}
                        <Skeleton className="h-8 w-64" /> {/* Title */}
                        <Skeleton className="h-6 w-24 rounded-full" /> {/* Status Badge */}
                    </div>
                        <Skeleton className="h-4 w-48 ml-14" /> {/* Subtitle */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Timeline Skeleton */}
                    <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px]">
                                <Skeleton className="h-6 w-32 mb-8" /> {/* Timeline Title */}
                                <div className="space-y-8 ml-4 border-l-2 border-gray-100 pl-6 relative">
                                {/* Timeline Items Mimic */}
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="space-y-2 relative">
                                        {/* Dot mimic */}
                                        <Skeleton className="absolute -left-[37px] h-8 w-8 rounded-full border-4 border-white" />
                                        <Skeleton className="h-4 w-24" /> {/* Status */}
                                        <Skeleton className="h-3 w-16" /> {/* Time */}
                                        <Skeleton className="h-5 w-14 rounded bg-gray-100" /> {/* Duration Badge */}
                                    </div>
                                ))}
                                </div>
                            </div>
                    </div>

                    {/* Right Logs Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-[500px] w-full rounded-xl bg-[#0d1117] border border-gray-800" />
                    </div>
                </div>
            </div>
            </div>
    )
}