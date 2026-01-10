import { Route, Routes, Navigate } from "react-router";
import Dashboard from "./pages/Dashboard";
import SubmitJob from "./pages/SubmitJob";   
import NotFound from "./pages/NotFound";
import JobDetails from "./pages/JobDetails";
import Run from "./pages/Run";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitJob />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/job/:id/run/:num" element={<Run />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    </div>
  )
}

export default App