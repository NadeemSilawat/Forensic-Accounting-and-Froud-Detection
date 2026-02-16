import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import FileUpload from './components/FileUpload'
import { mockTransactions } from './lib/data'
import type { Transaction } from './lib/types'

function App() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)

  const handleDataLoaded = (data: Transaction[]) => {
    setTransactions(data)
  }

  const handleUseSampleData = () => {
    setTransactions(mockTransactions)
  }

  const handleBack = () => {
    setTransactions(null)
  }

  if (transactions) {
    return <Dashboard transactions={transactions} onBack={handleBack} />
  }

  return <FileUpload onDataLoaded={handleDataLoaded} onUseSampleData={handleUseSampleData} />
}

export default App
