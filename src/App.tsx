import React, { useState } from 'react';
import { Section } from './types';
import { mockYarns, mockProjects, mockSamples, mockPatterns } from './data/mockData';
import YarnSection from './components/YarnSection';
import ProjectsSection from './components/ProjectsSection';
import SamplesSection from './components/SamplesSection';
import PatternsSection from './components/PatternsSection';
import { useSwipeToOpen } from './hooks/useSwipeToOpen';

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'yarn', label: 'Пряжа', icon: '🧶' },
  { id: 'projects', label: 'Проекты', icon: 'fas fa-tshirt' },
  { id: 'samples', label: 'Образцы', icon: 'fas fa-th-large' },
  { id: 'patterns', label: 'Схемы', icon: 'fas fa-book-open' },
];

function App() {
  const [activeSection, setActiveSection] = useState<Section>('yarn');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Swipe to open sidebar
  const { swipeOffset, swipeHandlers } = useSwipeToOpen(() => setMobileMenuOpen(true));

  const renderSection = () => {
    switch (activeSection) {
      case 'yarn':
        return <YarnSection yarns={mockYarns} projects={mockProjects} searchQuery={searchQuery} />;
      case 'projects':
        return <ProjectsSection projects={mockProjects} yarns={mockYarns} searchQuery={searchQuery} />;
      case 'samples':
        return <SamplesSection samples={mockSamples} yarns={mockYarns} searchQuery={searchQuery} />;
      case 'patterns':
        return <PatternsSection patterns={mockPatterns} searchQuery={searchQuery} />;
    }
  };

  const getCount = (section: Section) => {
    switch (section) {
      case 'yarn': return mockYarns.length;
      case 'projects': return mockProjects.length;
      case 'samples': return mockSamples.length;
      case 'patterns': return mockPatterns.length;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WoolFolio" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800">WoolFolio</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {section.icon.startsWith('fas') ? (
                <i className={`${section.icon} text-base`}></i>
              ) : (
                <span className="text-base">{section.icon}</span>
              )}
              <span className="flex-1 text-left">{section.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeSection === section.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {getCount(section.id)}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            WoolFolio v1.0<br />
            Учёт вязания
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {(mobileMenuOpen || swipeOffset > 0) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          style={{ opacity: mobileMenuOpen ? 1 : swipeOffset / 264 }}
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl ${
          mobileMenuOpen ? '' : 'transition-transform duration-300'
        }`}
        style={{
          transform: mobileMenuOpen 
            ? 'translateX(0)' 
            : `translateX(${swipeOffset - 264}px)`,
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WoolFolio" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800">WoolFolio</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {section.icon.startsWith('fas') ? (
                <i className={`${section.icon} text-base`}></i>
              ) : (
                <span className="text-base">{section.icon}</span>
              )}
              <span className="flex-1 text-left">{section.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeSection === section.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {getCount(section.id)}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64" {...swipeHandlers}>
        {/* Swipe edge indicator */}
        <div 
          className="md:hidden fixed top-0 left-0 w-1 h-full bg-emerald-500/20 z-30 pointer-events-none transition-opacity"
          style={{ opacity: swipeOffset > 0 ? 1 : 0 }}
        ></div>
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600"
                onClick={() => setMobileMenuOpen(true)}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>

              {/* Section Title */}
              <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                {(() => {
                  const icon = sections.find(s => s.id === activeSection)?.icon;
                  if (icon?.startsWith('fas')) {
                    return <i className={`${icon} text-emerald-500`}></i>;
                  }
                  return <span className="text-xl">{icon}</span>;
                })()}
                <span className="hidden sm:inline">{sections.find(s => s.id === activeSection)?.label}</span>
              </h2>

              {/* Search */}
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Add button */}
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                <i className="fas fa-plus mr-1"></i>
                <span className="hidden sm:inline">Добавить</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export default App;
