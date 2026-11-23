import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Lab from './pages/Lab'
import LabIndex from './pages/LabIndex'
import NotFound from './pages/NotFound'
import Roadmap from './pages/Roadmap'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="path" element={<Roadmap />} />
        <Route path="lab" element={<LabIndex />} />
        <Route path="lab/:id" element={<Lab />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
