import { intervalToDuration } from 'date-fns';

export const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const endDate = end ? new Date(end) : new Date();
    const startDate = new Date(start);
    
    // Safety check for invalid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

    const duration = intervalToDuration({ start: startDate, end: endDate });
    
    // Format for humans (e.g., "2s", "1m 30s")
    const zeroPad = (num: number) => String(num).padStart(2, '0');
    
    if ((duration.minutes || 0) > 0) {
        return `${duration.minutes}m ${zeroPad(duration.seconds || 0)}s`;
    }
    if ((duration.seconds || 0) > 0) {
        return `${duration.seconds}.${Math.floor((endDate.getTime() - startDate.getTime()) % 1000 / 100)}s`;
    }
    return `${endDate.getTime() - startDate.getTime()}ms`;
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'RUNNING': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
        case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
        case 'QUEUED': return 'bg-purple-50 text-purple-700 border-purple-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};