import { Route, Routes, Navigate } from "react-router";
import Dashboard from "./pages/Dashboard";
import SubmitJob from "./pages/SubmitJob";   
import NotFound from "./pages/NotFound";
import JobDetails from "./pages/JobDetails";
import Run from "./pages/Run";
import WorkflowDetails from "./pages/WorkflowDetails";
import CreateWorkflow from "./pages/CreateWorkflow";
import Layout from "./components/graph/Layout";

function App() {
  return (
    <Layout>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitJob />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/job/:id/run/:num" element={<Run />} />
            <Route path="/create-workflow" element={<CreateWorkflow />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/workflow/:id" element={<WorkflowDetails />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    </Layout>
  )
}

export default App