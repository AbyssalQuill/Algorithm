import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'

// 每个页面单独成包，打开哪页才下载哪页，首屏更轻、不卡
const Learn = lazy(() => import('./pages/Learn'))
const Lesson = lazy(() => import('./pages/Lesson'))
const Lab = lazy(() => import('./pages/Lab'))
const LabIndex = lazy(() => import('./pages/LabIndex'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={<div className="page-loading">翻页中…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<Learn />} />
          <Route path="learn/:track" element={<Learn />} />
          <Route path="learn/:track/:slug" element={<Lesson />} />
          <Route path="path" element={<Navigate to="/learn" replace />} />
          <Route path="lab" element={<LabIndex />} />
          <Route path="lab/:id" element={<Lab />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
