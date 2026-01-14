import { Handle, Position } from '@xyflow/react';
import { Clock, Terminal } from 'lucide-react';
import { getStatusColor, formatDuration } from '../../utils/formatters';
import { type NodeState, type WorkflowNode } from '../../types/workflow';

interface Props {
    data: {
        node: WorkflowNode;
        state: NodeState;
    }
}

export default function CustomNode({ data }: Props) {
    const { node, state } = data;
    const duration = formatDuration(state?.startedAt, state?.completedAt);

    return (
        <div className={`w-64 bg-white rounded-lg border-2 shadow-sm transition-all hover:shadow-md ${state?.status === 'RUNNING' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            {/* Header */}
            <div className={`px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-lg`}>
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-mono text-slate-500">{node.runtime}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusColor(state?.status || 'PENDING').replace('border', '')}`}>
                    {state?.status || 'PENDING'}
                </span>
            </div>

            {/* Body */}
            <div className="p-3">
                <div className="font-bold text-slate-800 text-sm mb-1">{node.jobName}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{duration}</span>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-2 !h-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-2 !h-2" />
        </div>
    );
}