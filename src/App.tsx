import { RouterProvider } from 'react-router-dom'

import { appRouter } from '@/app/router/app.route'
import '@/design-tokens.css'
import '@/responsive.css'
import '@/control-system.css'
import '@/phase-two.css'
import '@/phase-two-compat.css'
import '@/phase-two-dialog.css'
import '@/phase-two-content-crud.css'

function App() {
  return <RouterProvider router={appRouter} />
}

export default App
