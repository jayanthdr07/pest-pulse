import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SubGroupNav } from './components/SubGroupNav';
import { IncomingCallModal } from './components/IncomingCallModal';

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

export const AppContent: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
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
    <div className="min-h-screen bg-[#F4F6F3] flex flex-col font-sans antialiased text-[#2D3E2F] selection:bg-[#EBF7EE] selection:text-[#2E7D32]">
      {/* Sticky Top Bar & Header Nav Bar */}
      <Header onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
        {/* Mobile & Desktop Segmented Sub-Group Navigation */}
        <SubGroupNav />

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

      {/* Mobile Drawer (Shown on hamburger click on <1024px) */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Mobile Fixed Bottom Tab Bar (Shown only on <1024px) */}
      <MobileBottomNav />

      {/* Outbreak / Telemetry Emergency Phone Call Overlay Modal */}
      <IncomingCallModal />

      {/* Guided Farmer Onboarding & Login Modal */}
      <OnboardingModal />
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
