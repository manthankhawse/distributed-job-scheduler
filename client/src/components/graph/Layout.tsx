// client/src/components/Layout.tsx
import { Link, useLocation } from "react-router";
import { 
    LayoutDashboard, 
    Terminal, 
    Cpu, 
    GitGraph,
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Overview", icon: LayoutDashboard, path: "/" },
    { label: "Workflows", icon: GitGraph, path: "/create-workflow" },
    { label: "Jobs", icon: Terminal, path: "/submit" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* --- SIDEBAR (Unified Light Theme) --- */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
                
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold text-xl tracking-tight">
                        <div className="p-1.5 bg-black rounded-lg">
                            <Cpu className="w-5 h-5 text-white" />
                        </div>
                        <span>Flux<span className="text-slate-400 font-normal">.io</span></span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-4">
                        Platform
                    </p>
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                    isActive 
                                    ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-sm" 
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}

                     
                </nav>

                
            </aside>

            {/* --- MAIN CONTENT SCROLL AREA --- */}
            <main className="flex-1 overflow-auto bg-slate-50/50">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}