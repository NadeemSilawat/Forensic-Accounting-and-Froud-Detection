import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import DataEntryForm from './components/DataEntryForm'
import type { FormData } from './lib/types'

function App() {
  const [formData, setFormData] = useState<FormData | null>(null)

  if (formData) {
    return <Dashboard formData={formData} onBack={() => setFormData(null)} />
  }

  return <DataEntryForm onSubmit={setFormData} />
}

export default App
