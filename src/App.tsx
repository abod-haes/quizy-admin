import { RouterProvider } from 'react-router-dom'

import { appRouter } from '@/app/router/app.route'
import '@/responsive.css'
import '@/control-system.css'

function App() {
  return <RouterProvider router={appRouter} />
}

export default App
