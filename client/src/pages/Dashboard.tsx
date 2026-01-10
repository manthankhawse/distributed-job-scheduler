import { useQuery } from "@tanstack/react-query";
import fetchJobs from "../api/fetchJobs";
import { Link } from "react-router";
import { Activity, CheckCircle, XCircle, Clock, Server } from "lucide-react"; // npm install lucide-react
import { DashboardSkeleton, JobDetailsSkeleton } from "../components/Skeleton";
 
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        PENDING: "bg-gray-100 text-gray-600 border-gray-200",
        QUEUED: "bg-blue-50 text-blue-600 border-blue-200",
        RUNNING: "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse",
        COMPLETED: "bg-green-50 text-green-700 border-green-200",
        FAILED: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
};

// --- 2. Main Dashboard Component ---
function Dashboard() {
    const { isPending, error, data, isFetching } = useQuery({
        queryKey: ['jobs'],
        queryFn: fetchJobs,
        refetchInterval: 2000, // ⚡ Auto-poll every 2 seconds
    });

    if (isPending) return <DashboardSkeleton/>;
    if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

    // Calculate Stats
    const totalJobs = data.jobs.length;
    const activeJobs = data.jobs.filter((j: any) => ['RUNNING', 'QUEUED'].includes(j.state)).length;
    const failedJobs = data.jobs.filter((j: any) => j.state === 'FAILED').length;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Overview</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Server className="w-4 h-4" />
                            Cluster Status: {isFetching ? <span className="text-blue-600">Syncing...</span> : 'Online'}
                        </p>
                    </div>
                    <Link 
                        to="/submit" 
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Submit Job
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Processed</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalJobs}</h3>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg">
                                <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Now</p>
                                <h3 className="text-3xl font-bold text-blue-600 mt-2">{activeJobs}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Critical Failures</p>
                                <h3 className="text-3xl font-bold text-red-600 mt-2">{failedJobs}</h3>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-sm font-semibold text-gray-700">Recent Executions</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Job ID</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Runtime</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Created At</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.jobs.map((job: any) => (
                                    <tr key={job.jobId} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                            {job.jobId.split('-')[1]}...
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {job.name || 'Untitled Job'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                                                {job.runtime}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={job.state} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(job.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={`/job/${job.jobId}`}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Details &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Empty State */}
                    {data.jobs.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No jobs found. Start the scheduler!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;