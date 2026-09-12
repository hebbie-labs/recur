import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TasksProvider } from './contexts/TasksContext'
import { GroupsProvider } from './contexts/GroupsContext'
import ReactErrorBoundary from './components/error/ReactErrorBoundary.tsx'
import { TooltipProvider } from './components/ui/tooltip'
import { SidebarProvider } from './components/ui/sidebar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactErrorBoundary>
      <AuthProvider>
          <TooltipProvider>
            <SidebarProvider>
              <TasksProvider>
              <GroupsProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              </GroupsProvider>
              </TasksProvider>
            </SidebarProvider>
          </TooltipProvider>
      </AuthProvider>
    </ReactErrorBoundary>
  </StrictMode>
)