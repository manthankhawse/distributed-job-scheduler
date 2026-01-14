import { X, Box, Code2, AlertCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { type WorkflowNode, type NodeState } from '../../types/workflow';
import { formatDuration, getStatusColor } from '../../utils/formatters';

interface Props {
    node: WorkflowNode;
    state: NodeState;
    onClose: () => void;
}

export default function NodeInspector({ node, state, onClose }: Props) {
    return (
        <div className="absolute top-0 right-0 h-full w-[500px] bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{node.jobName}</h2>
                    <p className="font-mono text-xs text-slate-500 mt-1">{node.id}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Card */}
                <div className={`p-4 rounded-lg border flex justify-between items-center ${getStatusColor(state?.status || 'PENDING')}`}>
                    <span className="font-bold">{state?.status || 'PENDING'}</span>
                    <span className="font-mono text-sm">{formatDuration(state?.startedAt, state?.completedAt)}</span>
                </div>

                {/* Error Banner */}
                {state?.error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div className="break-all font-mono">{state.error}</div>
                    </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Job ID</div>
                        <div className="font-mono text-xs break-all">{state?.jobId || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Runtime</div>
                        <div className="font-mono text-xs">{node.runtime}</div>
                    </div>
                </div>

                {/* Handler Code */}
                <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                        <Code2 className="w-4 h-4" /> Handler Source
                    </div>
                    <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                        <SyntaxHighlighter language={node.runtime.includes('py') ? 'python' : 'javascript'} style={vs} customStyle={{margin: 0}}>
                            {node.handler}
                        </SyntaxHighlighter>
                    </div>
                </div>

                {/* Dependencies */}
                {node.dependencies.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                            <Box className="w-4 h-4" /> Upstream Dependencies
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {node.dependencies.map(dep => (
                                <span key={dep} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">
                                    {dep}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}