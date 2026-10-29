import React, { useState } from 'react';
import { Section } from './types';
import { mockYarns, mockProjects, mockSamples, mockPatterns } from './data/mockData';
import YarnSection from './components/YarnSection';
import ProjectsSection from './components/ProjectsSection';
import SamplesSection from './components/SamplesSection';
import PatternsSection from './components/PatternsSection';

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'yarn', label: 'Пряжа', icon: 'fas fa-yin-yang' },
  { id: 'projects', label: 'Проекты', icon: 'fas fa-tshirt' },
  { id: 'samples', label: 'Образцы', icon: 'fas fa-th-large' },
  { id: 'patterns', label: 'Схемы', icon: 'fas fa-book-open' },
];

function App() {
  const [activeSection, setActiveSection] = useState<Section>('yarn');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-heart text-white text-sm"></i>
              </div>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">KnitTracker</h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Поиск по всем разделам..."
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

            {/* Mobile menu button */}
            <button
              className="sm:hidden w-8 h-8 flex items-center justify-center text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className={`${section.icon} text-xs`}></i>
              <span>{section.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSection === section.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'
              }`}>
                {getCount(section.id)}
              </span>
            </button>
          ))}
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="sm:hidden mb-4 bg-white rounded-xl p-2 shadow-sm border border-gray-100">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`${section.icon} text-xs`}></i>
                <span>{section.label}</span>
                <span className="ml-auto text-xs opacity-70">{getCount(section.id)}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className={`${sections.find(s => s.id === activeSection)?.icon} text-emerald-500`}></i>
            {sections.find(s => s.id === activeSection)?.label}
          </h2>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <i className="fas fa-plus mr-1"></i>
            <span className="hidden sm:inline">Добавить</span>
          </button>
        </div>

        {/* Content */}
        {renderSection()}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                activeSection === section.id ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <i className={`${section.icon} text-lg`}></i>
              <span className="text-[10px] font-medium">{section.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
