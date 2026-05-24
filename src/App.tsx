import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './Shell'
import { HomePage } from './HomePage'
import { TitlePage } from './TitlePage'
import { CastPage } from './CastPage'
import { SettingsPage } from './SettingsPage'
import { useLocalStorageState } from './hooks'
import { defaultSettings, STORAGE_KEYS } from './hooks'
import type { ThemeSettings } from './hooks'

function App() {
  const [settings, setSettings] = useLocalStorageState<ThemeSettings>(STORAGE_KEYS.settings, defaultSettings)

  return (
    <Routes>
      <Route element={<Shell settings={settings} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/title/:mediaType/:id" element={<TitlePage />} />
        <Route path="/person/:id" element={<CastPage />} />
        <Route path="/settings" element={<SettingsPage settings={settings} onChange={setSettings} />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}

export default App
