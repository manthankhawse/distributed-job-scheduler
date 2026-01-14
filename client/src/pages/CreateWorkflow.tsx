import { useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Play , Code2, ArrowLeft, Package, FileUp, FileCode } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { createWorkflow, type WorkflowPayload } from '../api/createWorkflow';

const TEMPLATES = {
    'node:18': `const axios = require('axios');\n\n// Handler must return the output\nconst handler = async (payload) => {\n  console.log("🚀 Step Started");\n  return { success: true };\n};`,
    'python:3.9': `import requests\nimport json\n\ndef handler(payload):\n    print("🐍 Python Step")\n    return { "status": "ok" }`,
    'bash': `echo "🔥 Bash Step"\necho "Current Dir: $(pwd)"`
};

const EXTENSIONS: Record<string, string> = {
    'node:18': '.js',
    'python:3.9': '.py',
    'bash': '.sh'
};

export default function CreateWorkflow() {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [cron, setCron] = useState('');
    const [nodes, setNodes] = useState<WorkflowPayload['nodes']>([]);
    
    // UI State for the current node being added
    const [mode, setMode] = useState<'editor' | 'upload'>('editor');
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    // Form State for NEW Node
    const [newNode, setNewNode] = useState({
        id: '',
        jobName: '',
        runtime: 'node:18',
        handler: TEMPLATES['node:18'],
        dependencies: [] as string[],
        codeDependencies: '' 
    });

    const mutation = useMutation({
        mutationFn: createWorkflow,
        onSuccess: (data) => {
            if (data.workflowId) navigate(`/workflow/${data.workflowId}`);
            else if (data.scheduleId) navigate('/');
        },
        onError: (err: any) => alert(`Failed: ${err.message}`)
    });

    // --- HANDLERS ---

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validate Extension
        const requiredExt = EXTENSIONS[newNode.runtime];
        if (!file.name.endsWith(requiredExt)) {
            alert(`Invalid file type. Please upload a ${requiredExt} file for ${newNode.runtime} runtime.`);
            e.target.value = ''; // Reset input
            return;
        }

        // 2. Read Content Client-Side
        try {
            const text = await file.text();
            setNewNode({ ...newNode, handler: text });
            setUploadedFileName(file.name);
        } catch (err) {
            alert("Failed to read file content.");
        }
    };

    const addNode = () => {
        if (!newNode.id || !newNode.jobName) return alert("ID and Name are required");
        if (nodes.find(n => n.id === newNode.id)) return alert("ID must be unique");

        const pkgArray = newNode.codeDependencies
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        setNodes([...nodes, { 
            ...newNode,
            codeDependencies: pkgArray 
        } as any]); 
        
        // Reset Form
        setNewNode({
            id: `step-${nodes.length + 2}`,
            jobName: '',
            runtime: 'node:18',
            handler: TEMPLATES['node:18'],
            dependencies: [],
            codeDependencies: ''
        });
        setMode('editor');
        setUploadedFileName(null);
    };

    const removeNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
        setNodes(prev => prev.map(n => ({
            ...n,
            dependencies: n.dependencies.filter(d => d !== id)
        })));
    };

    // --- GRAPH PREVIEW ---
    const { graphNodes, graphEdges } = useMemo(() => {
        const gNodes: Node[] = [];
        const gEdges: Edge[] = [];
        
        const getLevel = (id: string, visited = new Set()): number => {
            if (visited.has(id)) return 0;
            visited.add(id);
            const n = nodes.find(x => x.id === id);
            if (!n || !n.dependencies.length) return 0;
            return Math.max(...n.dependencies.map(d => getLevel(d, new Set(visited)))) + 1;
        };

        const levels: Record<string, number> = {};
        nodes.forEach(n => levels[n.id] = getLevel(n.id));
        const levelCounts: Record<number, number> = {};

        nodes.forEach((node) => {
            const level = levels[node.id];
            const idx = levelCounts[level] || 0;
            levelCounts[level] = idx + 1;

            const pkgs = (node as any).codeDependencies || [];

            gNodes.push({
                id: node.id,
                position: { x: level * 280, y: idx * 120 },
                data: { 
                    label: (
                        <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-sm w-48 text-left">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">{node.runtime}</span>
                                {pkgs.length > 0 && <Package className="w-3 h-3 text-blue-500" />}
                            </div>
                            <div className="font-bold text-slate-800 text-sm truncate">{node.jobName}</div>
                            {pkgs.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-1 truncate">
                                    📦 {pkgs.join(', ')}
                                </div>
                            )}
                        </div>
                    ) 
                },
                style: { background: 'transparent', border: 'none' }
            });

            node.dependencies.forEach(dep => {
                gEdges.push({
                    id: `${dep}-${node.id}`,
                    source: dep,
                    target: node.id,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    type: 'smoothstep',
                    style: { stroke: '#94a3b8', strokeWidth: 2 }
                });
            });
        });

        return { graphNodes: gNodes, graphEdges: gEdges };
    }, [nodes]);

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900">Workflow Builder</h1>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Cron (e.g. */5 * * * *)" 
                        value={cron}
                        onChange={e => setCron(e.target.value)}
                        className="text-sm border border-slate-300 rounded px-3 py-1.5 font-mono w-48"
                    />
                    <button 
                        onClick={() => mutation.mutate({ nodes, cron: cron || undefined })}
                        disabled={nodes.length === 0 || mutation.isPending}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                    >
                        {mutation.isPending ? 'Deploying...' : <><Play className="w-4 h-4" /> Deploy Workflow</>}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-[450px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 space-y-4">
                        <h2 className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Workflow Step
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Step ID</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2 text-sm font-mono" 
                                    placeholder="step-1"
                                    value={newNode.id}
                                    onChange={e => setNewNode({...newNode, id: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700">Runtime</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm"
                                    value={newNode.runtime}
                                    onChange={e => {
                                        const rt = e.target.value;
                                        setNewNode({
                                            ...newNode, 
                                            runtime: rt,
                                            // @ts-ignore
                                            handler: TEMPLATES[rt]
                                        });
                                        // Reset upload state on runtime change
                                        setMode('editor');
                                        setUploadedFileName(null);
                                    }}
                                >
                                    <option value="node:18">Node.js 18</option>
                                    <option value="python:3.9">Python 3.9</option>
                                    <option value="bash">Bash</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700">Job Name</label>
                            <input 
                                className="w-full border border-slate-300 rounded p-2 text-sm" 
                                placeholder="e.g. Scrape Data"
                                value={newNode.jobName}
                                onChange={e => setNewNode({...newNode, jobName: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 mb-1">
                                <Package className="w-3 h-3" /> Libraries (Comma Separated)
                            </label>
                            <input 
                                className="w-full border border-slate-300 rounded p-2 text-sm font-mono placeholder:text-slate-300" 
                                placeholder="e.g. axios, pandas, requests"
                                value={newNode.codeDependencies}
                                onChange={e => setNewNode({...newNode, codeDependencies: e.target.value})}
                            />
                        </div>

                        {nodes.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-2 block">Depends On (DAG Edges)</label>
                                <div className="flex flex-wrap gap-2">
                                    {nodes.map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => {
                                                const isActive = newNode.dependencies.includes(n.id);
                                                setNewNode({
                                                    ...newNode,
                                                    dependencies: isActive 
                                                        ? newNode.dependencies.filter(d => d !== n.id)
                                                        : [...newNode.dependencies, n.id]
                                                });
                                            }}
                                            className={`px-3 py-1 rounded text-xs border transition-colors ${
                                                newNode.dependencies.includes(n.id)
                                                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {n.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- CODE LOGIC TOGGLE --- */}
                        <div className="border border-slate-200 rounded-lg p-1 bg-slate-50 flex gap-1">
                            <button 
                                onClick={() => setMode('editor')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    mode === 'editor' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Code Editor
                            </button>
                            <button 
                                onClick={() => setMode('upload')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    mode === 'upload' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Upload Script
                            </button>
                        </div>

                        {mode === 'editor' ? (
                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                    <Code2 className="w-3 h-3" /> Handler Logic
                                </label>
                                <textarea 
                                    className="w-full h-40 border border-slate-300 rounded p-2 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    value={newNode.handler}
                                    onChange={e => setNewNode({...newNode, handler: e.target.value})}
                                />
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer relative bg-white">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={handleFileChange}
                                    accept={EXTENSIONS[newNode.runtime]} 
                                />
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                    {uploadedFileName ? (
                                        <>
                                            <FileCode className="w-8 h-8 text-indigo-500" />
                                            <span className="text-slate-900 font-medium text-sm">{uploadedFileName}</span>
                                            <span className="text-xs text-green-600">✓ Content Loaded</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="w-8 h-8 text-slate-400" />
                                            <span className="text-sm font-medium">Upload {EXTENSIONS[newNode.runtime]} File</span>
                                            <span className="text-xs text-slate-400">Click to browse</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={addNode}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors shadow-sm"
                        >
                            Add Step to Graph
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Pipeline Steps ({nodes.length})</h3>
                        <div className="space-y-3">
                            {nodes.map((node, i) => (
                                <div key={node.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-800">{node.jobName}</span>
                                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">{node.runtime}</span>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500 mt-0.5">{node.id}</div>
                                            
                                            {/* Show deps if they exist */}
                                            {/* @ts-ignore */}
                                            {node.codeDependencies?.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {/* @ts-ignore */}
                                                    {node.codeDependencies.map((pkg: string) => (
                                                        <span key={pkg} className="text-[10px] px-1 bg-purple-50 text-purple-700 border border-purple-200 rounded flex items-center gap-1">
                                                            📦 {pkg}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => removeNode(node.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-slate-100 relative">
                    <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 shadow-sm">
                        Live Topology Preview
                    </div>
                    <ReactFlow 
                        nodes={graphNodes} 
                        edges={graphEdges} 
                        fitView
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls className="bg-white border-slate-200 shadow-sm" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}