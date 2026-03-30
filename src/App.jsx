import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientForm from './pages/ClientForm'
import Reports from './pages/Reports'
import NewReport from './pages/NewReport'
import ReportDetail from './pages/ReportDetail'
import ReportEdit from './pages/ReportEdit'
import PublicReport from './pages/PublicReport'
import AgentDashboard from './pages/AgentDashboard'
import AgentMessages from './pages/AgentMessages'
import AgentTasks from './pages/AgentTasks'
import Tasks from './pages/Tasks'
import QuickLogs from './pages/QuickLogs'
import Guide from './pages/Guide'
import Architecture from './pages/Architecture'
import Proposals from './pages/Proposals'
import ProposalEdit from './pages/ProposalEdit'
import ProposalDetail from './pages/ProposalDetail'
import PublicProposal from './pages/PublicProposal'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/r/:id" element={<PublicReport />} />
        <Route path="/p/:id" element={<PublicProposal />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id/edit" element={<ClientForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/new" element={<NewReport />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="reports/:id/edit" element={<ReportEdit />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="proposals/new" element={<ProposalEdit />} />
          <Route path="proposals/:id" element={<ProposalDetail />} />
          <Route path="proposals/:id/edit" element={<ProposalEdit />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="quick-logs" element={<QuickLogs />} />
          <Route path="agent" element={<AgentDashboard />} />
          <Route path="agent/messages" element={<AgentMessages />} />
          <Route path="agent/tasks" element={<AgentTasks />} />
          <Route path="guide" element={<Guide />} />
          <Route path="architecture" element={<Architecture />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default App
