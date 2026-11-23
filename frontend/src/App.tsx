import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AuthProvider } from './contexts/AuthContext'
import VLibras from './components/VLibras'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <VLibras />
    </AuthProvider>
  )
}
