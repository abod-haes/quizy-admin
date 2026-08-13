import { RouterProvider } from 'react-router-dom'

import { appRouter } from '@/app/router/app.route'
import '@/responsive.css'

function App() {
  return <RouterProvider router={appRouter} />
}

export default App
