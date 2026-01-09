import { Route, Routes } from "react-router"
import Dashboard from "./pages/Dashboard"
import Job from "./pages/Job"
import Run from "./pages/Run"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" Component={Dashboard}/>
        <Route path="/job/:id" Component={Job}/>
        <Route path="/job/:id/run/:num" Component={Run}/>
      </Routes>
    </>
  )
}

export default App
