import React, { useState } from 'react';
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

function MainApp() {
  const [activeScreen, setActiveScreen] = useState(SCREENS.MENU_HEALTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDemandItem, setSelectedDemandItem] = useState(null);
  const [passedCustomScenario, setPassedCustomScenario] = useState(null);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
      {/* Proper Left Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onOpenGuardrails={() => setIsGuardrailsOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Body Column with Proper Top Bar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Proper Top Bar */}
        <TopBar
          activeScreen={activeScreen}
          onOpenGuardrails={() => setIsGuardrailsOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        {/* Screen Content Body */}
        <main style={{
          flex: 1,
          padding: '1.5rem',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto'
        }}>
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
