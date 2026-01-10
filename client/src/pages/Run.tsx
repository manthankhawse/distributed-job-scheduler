import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router"; // or react-router-dom
import getJobById from "../api/getJob";
import { 
    ArrowLeft, Terminal, Clock, CheckCircle, 
    XCircle, Loader, Server, Database 
} from "lucide-react";
import { RunSkeleton } from "../components/Skeleton";

// Helper to format duration between two timestamps
const getDuration = (start: string, end?: string) => {
    if (!end) return "Ongoing...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return `${(ms / 1000).toFixed(2)}s`;
};

// Helper: Clean logs (reuse from before)
const cleanLogs = (logs: string) => {
    if (!logs) return "";
    return logs.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

function Run() {
    const { id, num } = useParams();
    const attemptNum = parseInt(num || "1");

    const { isPending, error, data } = useQuery({
        queryKey: ['job', id],
        queryFn: () => getJobById(id!),
    });

    if (isPending) return <RunSkeleton/>;
    if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

    // Handle API structure mismatch safely
    const job = data?.jobId ? data : data?.job;
    const attempt = job?.attempts?.find((a: any) => a.attemptNumber === attemptNum);

    if (!attempt) return <div className="p-8 text-red-500">Attempt #{attemptNum} not found.</div>;

    // Sort history by timestamp to ensure correct timeline order
    const history = [...attempt.history].sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header with Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/job/${id}`} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                Run #{attemptNum} Analysis
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                    attempt.finalStatus === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700' :
                                    attempt.finalStatus === 'FAILED' ? 'bg-red-50 border-red-200 text-red-700' :
                                    'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                    {attempt.finalStatus}
                                </span>
                            </h1>
                            <p className="text-gray-500 text-sm font-mono mt-1">
                                Job: {job.name} ({job.runtime})
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: The Lifecycle Timeline */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" /> Execution Cycle
                            </h3>
                            
                            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                                {history.map((event: any, idx: number) => {
                                    // Determine Icon based on status
                                    let Icon = Loader;
                                    let color = "bg-gray-100 text-gray-500";
                                    
                                    if (event.status === 'PENDING') { Icon = Database; color = "bg-purple-100 text-purple-600"; }
                                    if (event.status === 'QUEUED') { Icon = Server; color = "bg-blue-100 text-blue-600"; }
                                    if (event.status === 'RUNNING') { Icon = Loader; color = "bg-yellow-100 text-yellow-600"; }
                                    if (event.status === 'COMPLETED') { Icon = CheckCircle; color = "bg-green-100 text-green-600"; }
                                    if (event.status === 'FAILED') { Icon = XCircle; color = "bg-red-100 text-red-600"; }

                                    // Calculate time spent in this step (diff with next step)
                                    const nextEvent = history[idx + 1];
                                    const stepDuration = nextEvent 
                                        ? getDuration(event.timestamp, nextEvent.timestamp)
                                        : (event.status === 'COMPLETED' || event.status === 'FAILED') 
                                            ? "Final State" 
                                            : "Current State";

                                    return (
                                        <div key={idx} className="relative pl-8">
                                            {/* Dot / Icon */}
                                            <div className={`absolute -left-[17px] w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            
                                            {/* Content */}
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{event.status}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </p>
                                                <p className="text-xs font-medium text-gray-400 mt-1 bg-gray-50 inline-block px-1.5 py-0.5 rounded">
                                                    {stepDuration}
                                                </p>
                                                {event.message && (
                                                    <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                                                        "{event.message}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Logs & Artifacts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Terminal */}
                        <div className="bg-[#0d1117] rounded-xl overflow-hidden shadow-lg border border-gray-800 flex flex-col h-[500px]">
                            <div className="bg-[#161b22] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-400 font-mono">Run #{attemptNum} Logs</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">exit code: {attempt.exitCode}</span>
                            </div>
                            <div className="p-4 overflow-auto flex-1">
                                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {attempt.logs ? cleanLogs(attempt.logs) : <span className="text-gray-600 italic">No output captured.</span>}
                                </pre>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Run;