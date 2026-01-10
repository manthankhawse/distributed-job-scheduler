import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router";
import getJobById from "../api/getJob";
import { useState, useEffect } from "react";
import { 
    Terminal, 
    ArrowLeft, 
    AlertCircle, 
    CheckCircle, 
    Clock,
    ExternalLink, // 👈 Added Icon
    LayoutList    // 👈 Added Icon
} from "lucide-react";
import { JobDetailsSkeleton } from "../components/Skeleton";

const cleanLogs = (logs: string) => {
    if (!logs) return "";
    return logs.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

function JobDetails() {
    const { id } = useParams();
    const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number | null>(null);

    const { isPending, error, data } = useQuery({
        queryKey: ['job', id],
        queryFn: () => getJobById(id!),
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            return (state === 'COMPLETED' || state === 'FAILED') ? false : 1000;
        }
    });

    const job = data?.jobId ? data : data?.job; 

    useEffect(() => {
        if (job?.attempts?.length > 0 && selectedAttemptIndex === null) {
            setSelectedAttemptIndex(job.attempts.length - 1);
        }
    }, [job, selectedAttemptIndex]);

    if (isPending) return <JobDetailsSkeleton/>;
    if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;
    if (!job) return <div className="p-8 text-gray-500">Job not found.</div>;

    const attempts = job.attempts || [];
    const currentAttempt = selectedAttemptIndex !== null ? attempts[selectedAttemptIndex] : null;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-gray-200 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
                            <span className="font-mono text-sm bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                                {job.jobId}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Runtime: <span className="font-semibold">{job.runtime}</span> • 
                            Max Retries: {job.maxRetries}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Left Column: Attempt History Sidebar */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            History
                        </h3>
                        <div className="space-y-2">
                            {attempts.map((att: any, idx: number) => {
                                const isSelected = idx === selectedAttemptIndex;
                                const isSuccess = att.finalStatus === 'COMPLETED';
                                const isFailed = att.finalStatus === 'FAILED';
                                
                                return (
                                    <button
                                        key={att.attemptNumber}
                                        onClick={() => setSelectedAttemptIndex(idx)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                                            isSelected 
                                                ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' 
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div>
                                            <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                                Attempt #{att.attemptNumber}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {att.history?.[0]?.timestamp 
                                                    ? new Date(att.history[0].timestamp).toLocaleTimeString() 
                                                    : '--:--'}
                                            </p>
                                        </div>
                                        {isSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        {isFailed && <AlertCircle className="w-4 h-4 text-red-500" />}
                                        {!isSuccess && !isFailed && <Clock className="w-4 h-4 text-yellow-500 animate-spin-slow" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Terminal & Details */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Status Card */}
                        {currentAttempt && (
                            <div className="bg-white border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        Attempt #{currentAttempt.attemptNumber} Status
                                    </h2>
                                    
                                    <div className="flex items-center gap-3">
                                        {/* 🔗 LINK ADDED HERE */}
                                        <Link 
                                            to={`/job/${job.jobId}/run/${currentAttempt.attemptNumber}`}
                                            className="text-xs font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                            title="View Execution Timeline"
                                        >
                                            <LayoutList className="w-4 h-4" /> Timeline
                                        </Link>

                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            currentAttempt.finalStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            currentAttempt.finalStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {currentAttempt.finalStatus}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 mb-1">Exit Code</p>
                                        <p className="font-mono font-medium">
                                            {currentAttempt.exitCode ?? 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 mb-1">Duration</p>
                                        <p className="font-medium">
                                            {currentAttempt.completedAt && currentAttempt.history?.[0]?.timestamp
                                                ? `${((new Date(currentAttempt.completedAt).getTime() - new Date(currentAttempt.history[0].timestamp).getTime()) / 1000).toFixed(2)}s` 
                                                : 'Running...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Terminal View */}
                        <div className="bg-[#0d1117] rounded-xl overflow-hidden shadow-lg border border-gray-800">
                            <div className="bg-[#161b22] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-400 font-mono">Console Output</span>
                                </div>
                                {/* 🔗 OPTIONAL: Link also available here for easy access */}
                                {currentAttempt && (
                                    <Link 
                                        to={`/job/${job.jobId}/run/${currentAttempt.attemptNumber}`}
                                        className="text-gray-500 hover:text-white transition"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                            <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {currentAttempt?.logs 
                                        ? cleanLogs(currentAttempt.logs) 
                                        : <span className="text-gray-600 italic">No logs available (or job is initializing)...</span>}
                                </pre>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobDetails;