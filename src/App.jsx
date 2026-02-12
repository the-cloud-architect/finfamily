import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState([])
  const [currentScenario, setCurrentScenario] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load user's scenarios from database
  useEffect(() => {
    if (user) {
      loadScenarios()
    }
  }, [user])

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setScenarios(data || [])
    } catch (error) {
      console.error('Error loading scenarios:', error)
    }
  }

  const saveScenario = async (scenarioData) => {
    try {
      if (currentScenario?.id) {
        // Update existing scenario
        const { error } = await supabase
          .from('scenarios')
          .update({
            name: scenarioData.name,
            data: scenarioData.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentScenario.id)

        if (error) throw error
      } else {
        // Create new scenario
        const { error } = await supabase
          .from('scenarios')
          .insert([{
            user_id: user.id,
            name: scenarioData.name,
            data: scenarioData.data
          }])

        if (error) throw error
      }

      await loadScenarios()
      alert('Scenario saved successfully!')
    } catch (error) {
      console.error('Error saving scenario:', error)
      alert('Error saving scenario: ' + error.message)
    }
  }

  const deleteScenario = async (id) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return

    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadScenarios()
    } catch (error) {
      console.error('Error deleting scenario:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setScenarios([])
    setCurrentScenario(null)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />
  }

  return (
    <div className="App">
      <header style={{
        padding: '1rem',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>Financial Family Scenarios</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>{user.email}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2>Your Scenarios</h2>
          <button
            onClick={() => setCurrentScenario(null)}
            style={{
              padding: '0.5rem 1rem',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            + New Scenario
          </button>

          {scenarios.length === 0 ? (
            <p>No scenarios yet. Create your first one!</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3>{scenario.name}</h3>
                    <small>
                      Updated: {new Date(scenario.updated_at).toLocaleDateString()}
                    </small>
                  </div>
                  <div>
                    <button
                      onClick={() => setCurrentScenario(scenario)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      style={{ background: '#f44336', color: 'white' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your existing scenario editor would go here */}
        <div>
          <h2>{currentScenario ? 'Edit Scenario' : 'New Scenario'}</h2>
          {/* Add your scenario form/editor component here */}
          {/* Example save button: */}
          <button
            onClick={() => saveScenario({
              name: 'Test Scenario',
              data: { /* your scenario data */ }
            })}
          >
            Save Scenario
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
