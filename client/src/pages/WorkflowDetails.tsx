import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router';
import { ReactFlow, Background, Controls, type Node, type Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { format } from 'date-fns';
import { ArrowLeft, GitGraph, List, FileJson, Activity, Layers, Clock } from 'lucide-react';

import CustomNode from '../components/graph/CustomNode';
import NodeInspector from '../components/inspector/NodeInspector';
import { formatDuration, getStatusColor } from '../utils/formatters';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TABS = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'graph', label: 'Graph', icon: GitGraph },
    { id: 'timeline', label: 'Timeline', icon: List },
    { id: 'output', label: 'Output', icon: Layers },
    { id: 'json', label: 'JSON', icon: FileJson },
];

const nodeTypes = { custom: CustomNode };

export default function WorkflowDetails() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('graph');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Fetch Workflow Data
    const { data: workflow, isLoading } = useQuery({
        queryKey: ['workflow', id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3000/workflows/${id}`);
            return (await res.json()).workflow;
        },
        refetchInterval: (query) => query.state.data?.status === 'RUNNING' ? 1000 : false
    });

    // --- Graph Logic: Auto-Layout ---
    const { nodes, edges } = useMemo(() => {
        if (!workflow) return { nodes: [], edges: [] };
        
        const layoutNodes: Node[] = [];
        const layoutEdges: Edge[] = [];
        
        // Simple Level Calculation
        const levels: Record<string, number> = {};
        const getLevel = (nodeId: string, visited = new Set()): number => {
            if (visited.has(nodeId)) return 0;
            visited.add(nodeId);
            const n = workflow.nodes.find((x: any) => x.id === nodeId);
            if (!n || !n.dependencies.length) return 0;
            return Math.max(...n.dependencies.map((d: string) => getLevel(d, new Set(visited)))) + 1;
        };

        workflow.nodes.forEach((n: any) => levels[n.id] = getLevel(n.id));
        const levelCounts: Record<number, number> = {};

        workflow.nodes.forEach((node: any) => {
            const level = levels[node.id];
            const idx = levelCounts[level] || 0;
            levelCounts[level] = idx + 1;

            layoutNodes.push({
                id: node.id,
                type: 'custom',
                position: { x: level * 350, y: idx * 150 }, // Left-to-Right layout
                data: { node, state: workflow.state[node.id] }
            });

            node.dependencies.forEach((dep: string) => {
                const parentState = workflow.state[dep];
                layoutEdges.push({
                    id: `${dep}-${node.id}`,
                    source: dep,
                    target: node.id,
                    type: 'smoothstep',
                    animated: workflow.state[node.id]?.status === 'RUNNING',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { 
                        stroke: parentState?.status === 'COMPLETED' ? '#94a3b8' : '#e2e8f0',
                        strokeWidth: 2
                    }
                });
            });
        });

        return { nodes: layoutNodes, edges: layoutEdges };
    }, [workflow]);

    if (isLoading || !workflow) return <div className="p-10">Loading...</div>;

    const selectedNodeData = selectedNodeId ? workflow.nodes.find((n: any) => n.id === selectedNodeId) : null;
    const selectedNodeState = selectedNodeId ? workflow.state[selectedNodeId] : null;

    // --- Calculate Stats ---
    const startTime = workflow.nodes.map((n:any) => workflow.state[n.id]?.startedAt).sort()[0];
    const endTime = workflow.status === 'COMPLETED' || workflow.status === 'FAILED' 
        ? workflow.updatedAt : undefined;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            
            {/* 1. Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900">Workflow Execution</h1>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(workflow.status)}`}>
                                    {workflow.status}
                                </span>
                            </div>
                            <div className="font-mono text-xs text-slate-400 mt-1">{workflow.workflowId}</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-slate-100 -mb-4">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${
                                    activeTab === tab.id 
                                    ? 'border-slate-900 text-slate-900' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6 relative">
                
                {/* --- SUMMARY TAB --- */}
                {activeTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard label="Total Duration" value={formatDuration(startTime, endTime)} />
                        <SummaryCard label="Start Time" value={startTime ? format(new Date(startTime), 'PPpp') : '-'} />
                        <SummaryCard label="Trigger Type" value={workflow.trigger} />
                        <SummaryCard label="Node Count" value={workflow.nodes.length} />
                    </div>
                )}

                {/* --- GRAPH TAB --- */}
                {activeTab === 'graph' && (
                    <div className="h-[600px] border border-slate-200 rounded-lg bg-slate-100 overflow-hidden relative">
                        <ReactFlow 
                            nodes={nodes} 
                            edges={edges} 
                            nodeTypes={nodeTypes}
                            fitView 
                            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        >
                            <Background color="#cbd5e1" gap={20} size={1} />
                            <Controls className="bg-white border-slate-200 shadow-sm" />
                        </ReactFlow>
                        
                        {/* Inspector Slide-over */}
                        {selectedNodeId && selectedNodeData && (
                            <NodeInspector 
                                node={selectedNodeData} 
                                state={selectedNodeState} 
                                onClose={() => setSelectedNodeId(null)} 
                            />
                        )}
                    </div>
                )}


                {/* --- TIMELINE TAB (GANTT VISUALIZATION) --- */}
                {activeTab === 'timeline' && (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" /> Execution Waterfall
                        </h3>
                        
                        <div className="relative space-y-4">
                            {/* Grid Lines (Background) */}
                            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
                                <div className="border-l border-slate-900 h-full"></div>
                                <div className="border-l border-slate-900 h-full"></div>
                                <div className="border-l border-slate-900 h-full"></div>
                                <div className="border-l border-slate-900 h-full"></div>
                                <div className="border-l border-slate-900 h-full"></div>
                            </div>

                            {workflow.nodes.map((node: any) => {
                                const state = workflow.state[node.id];
                                if (!state || !state.startedAt || !startTime) return null;

                                const startMs = new Date(state.startedAt).getTime();
                                const endMs = state.completedAt ? new Date(state.completedAt).getTime() : Date.now();
                                const workflowStartMs = new Date(startTime).getTime();
                                const workflowEndMs = endTime ? new Date(endTime).getTime() : Date.now();
                                const totalDuration = Math.max(workflowEndMs - workflowStartMs, 1000); // Avoid div by zero

                                // Calculate positioning
                                const leftPercent = ((startMs - workflowStartMs) / totalDuration) * 100;
                                const widthPercent = Math.max(((endMs - startMs) / totalDuration) * 100, 1); // Min 1% width

                                return (
                                    <div key={node.id} className="relative flex items-center group">
                                        {/* Label */}
                                        <div className="w-48 text-xs font-medium text-slate-600 truncate pr-4 text-right">
                                            {node.jobName}
                                        </div>

                                        {/* Bar Track */}
                                        <div className="flex-1 h-8 bg-slate-50 rounded-lg relative overflow-hidden">
                                            {/* Actual Bar */}
                                            <div 
                                                className={`absolute h-full rounded-md opacity-80 transition-all duration-500 group-hover:opacity-100 flex items-center px-2 ${
                                                    state.status === 'FAILED' ? 'bg-red-200 text-red-800' : 
                                                    state.status === 'RUNNING' ? 'bg-blue-200 text-blue-800 animate-pulse' : 
                                                    'bg-indigo-200 text-indigo-800'
                                                }`}
                                                style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                            >
                                                <span className="text-[10px] font-bold whitespace-nowrap overflow-hidden">
                                                    {formatDuration(state.startedAt, state.completedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="bg-white border border-slate-200 my-4 p-8 rounded-lg overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {workflow.events.map((event: any, i: number) => {
                                const timeDelta = i > 0 
                                    ? new Date(event.timestamp).getTime() - new Date(workflow.events[0].timestamp).getTime()
                                    : 0;
                                return (
                                    <div key={i} className="px-6 py-3 flex gap-4 hover:bg-slate-50 font-mono text-sm">
                                        <div className="w-24 text-slate-400 text-right">
                                            +{formatDuration(new Date(event.timestamp).toISOString(), new Date(new Date(event.timestamp).getTime() + timeDelta).toISOString())}
                                        </div>
                                        <div className="w-32 text-slate-500">
                                            {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`font-bold mr-2 ${event.type.includes('FAIL') ? 'text-red-600' : 'text-slate-800'}`}>
                                                {event.type}
                                            </span>
                                            <span className="text-slate-600">{event.details}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* --- OUTPUT TAB --- */}
                {activeTab === 'output' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(workflow.context || {}).map(([key, value]) => (
                            <div key={key} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{key}</div>
                                {typeof value === 'object' ? (
                                    <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto max-h-40">
                                        {JSON.stringify(value, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="text-lg font-medium text-slate-900">{String(value)}</div>
                                )}
                            </div>
                        ))}
                        {Object.keys(workflow.context || {}).length === 0 && (
                            <div className="text-slate-400 italic">No context output generated yet.</div>
                        )}
                    </div>
                )}

                {/* --- JSON TAB --- */}
                {activeTab === 'json' && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                        <SyntaxHighlighter language="json" style={vs} showLineNumbers>
                            {JSON.stringify(workflow, null, 2)}
                        </SyntaxHighlighter>
                    </div>
                )}
            </main>
        </div>
    );
}

const SummaryCard = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="text-slate-500 text-sm font-medium mb-1">{label}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
);