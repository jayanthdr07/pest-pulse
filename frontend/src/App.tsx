import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './views/HomeView';
import { CropPassportView } from './views/CropPassportView';
import { PublicPassportView } from './views/PublicPassportView';
import { ConsultationView } from './views/ConsultationView';
import { VoiceAgentView } from './views/VoiceAgentView';
import { TrapGalleryView } from './views/TrapGalleryView';
import { PhotoCountView } from './views/PhotoCountView';
import { FieldsView } from './views/FieldsView';
import { MonitoringView } from './views/MonitoringView';
import { TrendsView } from './views/TrendsView';
import { IntelligenceView } from './views/IntelligenceView';
import { WeatherView } from './views/WeatherView';
import { RecommendationsView } from './views/RecommendationsView';
import { DiseasesView } from './views/DiseasesView';
import { DevicesView } from './views/DevicesView';
import { AlertsView } from './views/AlertsView';
import { ThreeDView } from './views/ThreeDView';
import { SettingsView } from './views/SettingsView';
import { OnboardingModal } from './views/OnboardingModal';
import { FloatingChatbot } from './components/FloatingChatbot';

export const AppContent: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  // If visitor is viewing a public QR passport report, render dedicated standalone view
  if (location.pathname.startsWith('/passport-view')) {
    return (
      <Routes>
        <Route path="/passport-view/:token" element={<PublicPassportView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans antialiased text-stone-900">
      {/* Left Sidebar Navigation (Dashboard option prominently pinned on left side) */}
      <Sidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/passport" element={<CropPassportView />} />
            <Route path="/consultation" element={<ConsultationView />} />
            <Route path="/voice" element={<VoiceAgentView />} />
            <Route path="/trap-gallery" element={<TrapGalleryView />} />
            <Route path="/photo-count" element={<PhotoCountView />} />
            <Route path="/fields" element={<FieldsView />} />
            <Route path="/monitoring" element={<MonitoringView />} />
            <Route path="/trends" element={<TrendsView />} />
            <Route path="/intelligence" element={<IntelligenceView />} />
            <Route path="/weather" element={<WeatherView />} />
            <Route path="/recommendations" element={<RecommendationsView />} />
            <Route path="/diseases" element={<DiseasesView />} />
            <Route path="/devices" element={<DevicesView />} />
            <Route path="/alerts" element={<AlertsView />} />
            <Route path="/3d-demo" element={<ThreeDView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <OnboardingModal />
        <FloatingChatbot />

        {/* Farmer-friendly footer */}
        <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong>PestPulse</strong> — Connected AI & IoT Smart Agriculture Platform • Team Prime Minds
            </p>
            <p className="text-[11px] text-stone-400">
              ICAR-IIHR Hesaraghatta agronomic guidelines • Sourced chemical and IPM recommendations
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
