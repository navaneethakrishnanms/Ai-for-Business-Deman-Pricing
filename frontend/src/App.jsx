import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { GuardrailsProvider } from './context/GuardrailsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SCREENS } from './components/layout/Navbar';
import { AssistantModal } from './components/layout/AssistantModal';
import { ToastContainer } from './components/common/ToastContainer';
import { GuardrailsModal } from './pages/MenuHealth/GuardrailsModal';

import { MenuHealth } from './pages/MenuHealth/MenuHealth';
import { DemandLab } from './pages/DemandLab/DemandLab';
import { ScenarioCompare } from './pages/ScenarioCompare/ScenarioCompare';
import { ComboStudio } from './pages/ComboStudio/ComboStudio';
import { Recommendations } from './pages/Recommendations/Recommendations';
import { StudentBudgetBuilder } from './pages/StudentBudgetBuilder/StudentBudgetBuilder';

const getInitialScreen = () => {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const validScreens = Object.values(SCREENS);
    if (hash && validScreens.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('campusprice_active_screen');
    if (saved && validScreens.includes(saved)) {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return SCREENS.MENU_HEALTH;
};

function MainApp() {
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [selectedDemandItem, setSelectedDemandItem] = useState(null);
  const [passedCustomScenario, setPassedCustomScenario] = useState(null);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Sync activeScreen with URL hash and localStorage
  useEffect(() => {
    try {
      window.location.hash = `#/${activeScreen}`;
      localStorage.setItem('campusprice_active_screen', activeScreen);
    } catch (e) {
      // ignore
    }
  }, [activeScreen]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (Object.values(SCREENS).includes(hash)) {
        setActiveScreen(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Cross-screen navigation helpers
  const handleNavigateToDemandLab = (itemId) => {
    setSelectedDemandItem(itemId);
    setActiveScreen(SCREENS.DEMAND_LAB);
  };

  const handleApplyAssistantScenario = (scenario) => {
    setPassedCustomScenario(scenario);
    setActiveScreen(SCREENS.SCENARIOS);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Clean Left Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
      />

      {/* Main Body Column with Top Bar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <TopBar
          activeScreen={activeScreen}
          onOpenGuardrails={() => setIsGuardrailsOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        {/* Screen Content Body with Animated Transition */}
        <main style={{
          flex: 1,
          padding: '1.5rem',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto'
        }}>
          <div key={activeScreen} className="page-transition">
            {activeScreen === SCREENS.MENU_HEALTH && (
              <MenuHealth onNavigateToDemandLab={handleNavigateToDemandLab} />
            )}

            {activeScreen === SCREENS.DEMAND_LAB && (
              <DemandLab preselectedItemId={selectedDemandItem} />
            )}

            {activeScreen === SCREENS.SCENARIOS && (
              <ScenarioCompare initialCustomScenario={passedCustomScenario} />
            )}

            {activeScreen === SCREENS.COMBO_STUDIO && (
              <ComboStudio />
            )}

            {activeScreen === SCREENS.RECOMMENDATIONS && (
              <Recommendations />
            )}

            {activeScreen === SCREENS.STUDENT_BUDGET && (
              <StudentBudgetBuilder />
            )}
          </div>
        </main>
      </div>


      {/* Global AI Co-pilot Drawer (Part G) */}
      <AssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onApplyScenario={handleApplyAssistantScenario}
      />

      {/* Owner Guardrails Modal (Part A) */}
      <GuardrailsModal
        isOpen={isGuardrailsOpen}
        onClose={() => setIsGuardrailsOpen(false)}
      />

      {/* Floating System Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GuardrailsProvider>
          <NotificationProvider>
            <MainApp />
          </NotificationProvider>
        </GuardrailsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
