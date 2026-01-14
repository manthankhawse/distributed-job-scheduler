import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { 
    Activity, XCircle, Zap, Calendar, 
    ArrowRight, GitGraph, Layers, Search, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { getStatusColor, formatDuration } from '../utils/formatters';
import { DashboardSkeleton } from '../components/Skeleton';

const apiUrl = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 9; 

// --- FETCHERS ---
const fetchWorkflows = async () => (await fetch(`${apiUrl}/workflows`)).json().then(res => res.workflows);
const fetchJobs = async () => (await fetch(`${apiUrl}/jobs`)).json().then(res => res.jobs);

// --- COMPONENTS ---
const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
);

const TabButton = ({ active, label, icon: Icon, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active 
            ? 'bg-slate-900 text-white shadow-md' 
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default function Dashboard() {
    const [view, setView] = useState<'workflows' | 'jobs'>('workflows');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: workflows, isLoading: wfLoading } = useQuery({ 
        queryKey: ['workflows'], queryFn: fetchWorkflows, refetchInterval: 2000 
    });
    const { data: jobs, isLoading: jobLoading } = useQuery({ 
        queryKey: ['jobs'], queryFn: fetchJobs, refetchInterval: 2000 
    });

    if (wfLoading || jobLoading) return <DashboardSkeleton />;

    // --- FILTER & PAGINATION LOGIC ---
    const rawList = view === 'workflows' ? workflows : jobs;
    
    // 1. Filter
    const filteredList = (rawList || []).filter((item: any) => {
        const id = item.workflowId || item.jobId || '';
        const status = item.status || item.state || '';
        const name = item.name || '';
        const query = search.toLowerCase();
        return id.toLowerCase().includes(query) || status.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    });

    // 2. Paginate
    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const paginatedList = filteredList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Calculate Stats
    const allExecutions = [...(workflows || []), ...(jobs || [])];
    const activeCount = allExecutions.filter((x: any) => ['RUNNING', 'QUEUED', 'PENDING'].includes(x.status || x.state)).length;
    const failedCount = allExecutions.filter((x: any) => (x.status === 'FAILED' || x.state === 'FAILED')).length;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Control Plane</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-green-600 font-medium">System Operational</span>
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Executions" value={allExecutions.length} icon={<Activity className="w-5 h-5 text-blue-600" />} color="bg-blue-50" />
                <StatCard title="Active Jobs" value={activeCount} icon={<Zap className="w-5 h-5 text-amber-500" />} color="bg-amber-50" />
                <StatCard title="Critical Failures" value={failedCount} icon={<XCircle className="w-5 h-5 text-red-600" />} color="bg-red-50" />
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex gap-3">
                        <TabButton active={view === 'workflows'} onClick={() => { setView('workflows'); setCurrentPage(1); }} label="Workflows" icon={GitGraph} />
                        <TabButton active={view === 'jobs'} onClick={() => { setView('jobs'); setCurrentPage(1); }} label="Atomic Jobs" icon={Layers} />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search ID..." 
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Context</th>
                                <th className="px-6 py-4">Runtime</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedList.map((item: any) => {
                                const isWf = view === 'workflows';
                                const id = isWf ? item.workflowId : item.jobId;
                                const status = isWf ? item.status : item.state;
                                const date = item.createdAt;
                                
                                // Calculate Duration for Workflows
                                let duration = '-';
                                if (isWf) {
                                    const lastNode = Object.values(item.state || {})
                                        .sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0] as any;
                                    duration = formatDuration(item.createdAt, lastNode?.completedAt);
                                }

                                return (
                                    <tr key={id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm font-medium text-slate-700 truncate w-48" title={id}>{id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isWf ? (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    {item.trigger === 'CRON' ? <Calendar className="w-4 h-4 text-purple-500" /> : <Zap className="w-4 h-4 text-amber-500" />}
                                                    <span className="font-medium">{item.trigger}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-600 font-medium">{item.name || 'Untitled'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                            {isWf ? (
                                                <span>{duration} <span className="text-slate-400">({item.nodes?.length || 0} steps)</span></span>
                                            ) : (
                                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.runtime}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {format(new Date(date), 'MMM d, HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={isWf ? `/workflow/${id}` : `/job/${id}`} 
                                                className="text-slate-400 hover:text-indigo-600 transition-colors inline-block p-2 rounded-full hover:bg-indigo-50"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {paginatedList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <p>No results found for "{search}"</p>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)}</span> of <span className="font-medium">{filteredList.length}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 px-2">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}