import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router"; // or "react-router-dom"
import { createJob } from "../api/createJob";
import { ArrowLeft, Play, Code2, Layers, Cpu } from "lucide-react";

// --- TEMPLATES ---
const TEMPLATES: Record<string, { code: string; deps: string }> = {
    'node:18': {
        deps: 'axios',
        code: `// Node.js 18 Template
const axios = require('axios');

module.exports = async (payload) => {
    console.log("🚀 Starting Node.js Worker...");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    // Simulate API Call
    const res = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
    console.log("✅ Data fetched:", res.data.title);
    
    console.log("Done!");
};`
    },
    'python:3.9': {
        deps: 'requests',
        code: `# Python 3.9 Template
import os
import json
import requests

# Payload is injected as Env Var
payload = json.loads(os.environ.get("PAYLOAD", "{}"))

print(f"🐍 Starting Python Worker for {payload.get('name', 'User')}...")

# Simulate work
response = requests.get("https://httpbin.org/json")
print(f"✅ External API Status: {response.status_code}")

print("Done!")`
    },
    'bash': {
        deps: '',
        code: `# Bash Template
echo "💻 Starting Bash Script..."
echo "Current Directory: $(pwd)"
echo "Payload Data: $PAYLOAD"

# Sleep to simulate work
sleep 2
echo "✅ Script Finished"`
    }
};

function SubmitJob() {
    const navigate = useNavigate();
    
    // Form State
    const [name, setName] = useState("");
    const [runtime, setRuntime] = useState("node:18");
    const [code, setCode] = useState(TEMPLATES['node:18'].code);
    const [dependencies, setDependencies] = useState(TEMPLATES['node:18'].deps);
    const [payload, setPayload] = useState('{"name": "test-user"}');

    const mutation = useMutation({
        mutationFn: createJob,
        onSuccess: (data) => {
            // Redirect to the flight recorder immediately
            navigate(`/job/${data.jobId}`);
        },
        onError: (err: any) => {
            alert("Failed to submit job: " + err.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', name || 'manual-job');
        formData.append('runtime', runtime);
        formData.append('type', 'SDK_JOB'); // Or generic
        formData.append('payload', payload);
        
        // Handle Dependencies
        if (dependencies.trim()) {
            const depList = dependencies.split(',').map(d => d.trim());
            formData.append('dependencies', JSON.stringify(depList));
        }

        // Handle Code/File
        // We convert the string code into a file object for the backend
        const extension = runtime === 'python:3.9' ? '.py' : runtime === 'bash' ? '.sh' : '.js';
        const blob = new Blob([code], { type: 'text/plain' });
        const file = new File([blob], `payload${extension}`);
        formData.append('script', file);

        mutation.mutate(formData);
    };

    const applyTemplate = (rt: string) => {
        setRuntime(rt);
        setCode(TEMPLATES[rt].code);
        setDependencies(TEMPLATES[rt].deps);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-200 rounded-full transition">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Launchpad</h1>
                            <p className="text-gray-500 text-sm">Manually trigger a distributed task</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* 1. Job Config */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
                            <Cpu className="w-4 h-4" /> Configuration
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. daily-report-gen"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Runtime</label>
                                <div className="flex gap-2">
                                    {['node:18', 'python:3.9', 'bash'].map(rt => (
                                        <button
                                            key={rt}
                                            type="button"
                                            onClick={() => applyTemplate(rt)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                                                runtime === rt 
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {rt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dependencies <span className="text-gray-400 font-normal">(comma separated)</span>
                            </label>
                            <input 
                                type="text" 
                                value={dependencies}
                                onChange={e => setDependencies(e.target.value)}
                                placeholder="e.g. axios, lodash (Node) or requests, pandas (Python)"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* 2. Code Editor */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
                            <Code2 className="w-4 h-4" /> Source Code
                        </h2>
                        <div className="relative">
                            <textarea 
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="w-full h-64 bg-[#0d1117] text-gray-300 font-mono text-sm p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                spellCheck="false"
                            />
                            <div className="absolute top-2 right-2 text-xs text-gray-500 bg-[#161b22] px-2 py-1 rounded">
                                {runtime}
                            </div>
                        </div>
                    </div>

                    {/* 3. Payload */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
                            <Layers className="w-4 h-4" /> JSON Payload
                        </h2>
                        <textarea 
                            value={payload}
                            onChange={e => setPayload(e.target.value)}
                            className="w-full h-24 font-mono text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? 'Deploying...' : (
                            <>
                                <Play className="w-4 h-4 fill-current" /> Deploy & Run Job
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}

export default SubmitJob;