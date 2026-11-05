import React, { useState, useEffect, useRef } from 'react';
import { Section, Yarn, Project, Sample, Pattern } from './types';
import YarnSection from './components/YarnSection';
import ProjectsSection from './components/ProjectsSection';
import SamplesSection from './components/SamplesSection';
import PatternsSection from './components/PatternsSection';
import Dashboard from './components/Dashboard';
import AddYarnForm from './components/AddYarnForm';
import AddProjectForm from './components/AddProjectForm';
import AddSampleForm from './components/AddSampleForm';
import AddPatternForm from './components/AddPatternForm';
import EditYarnForm from './components/EditYarnForm';
import EditSampleForm from './components/EditSampleForm';
import EditPatternForm from './components/EditPatternForm';
import EditProjectForm from './components/EditProjectForm';
import { useSwipeToOpen } from './hooks/useSwipeToOpen';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import { exportToJSON, exportYarnsToCSV, exportProjectsToCSV } from './utils/export';
import pb from './lib/pocketbase';

// Вспомогательная функция: превращает Base64 строку в настоящий File объект
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : (filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Извлекает имя файла из URL PocketBase
const extractFilename = (url: string): string => {
  if (!url) return '';
  // URL выглядит как: https://domain/api/files/collection/recordId/filename
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
};

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Главная', icon: 'fas fa-home' },
  { id: 'yarn', label: 'Пряжа', icon: '🧶' },
  { id: 'projects', label: 'Проекты', icon: 'fas fa-tshirt' },
  { id: 'samples', label: 'Образцы', icon: 'fas fa-th-large' },
  { id: 'patterns', label: 'Схемы', icon: 'fas fa-book-open' },
];

// Безопасный парсинг массива из строки PocketBase
const safeParseArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      // Если PocketBase сохранил массив как строку через запятую (глюк текстового поля)
      if (value.includes(',') && !value.startsWith('[')) {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return []; // Если не удалось распарсить, возвращаем пустой массив, а не крашим приложение
    }
  }
  return [];
};

function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);

  // Данные
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Формы добавления
  const [showAddYarn, setShowAddYarn] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddSample, setShowAddSample] = useState(false);
  const [showAddPattern, setShowAddPattern] = useState(false);

  // Формы редактирования
  const [editingYarn, setEditingYarn] = useState<Yarn | null>(null);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Swipe to open sidebar
  const { swipeOffset, swipeHandlers } = useSwipeToOpen(() => setMobileMenuOpen(true));

  // Загрузка данных из PocketBase
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

      const loadData = async () => {
    setDataLoading(true);
    try {
      const [yarnsData, projectsData, samplesData, patternsData] = await Promise.all([
        pb.collection('yarns').getFullList({ sort: '-created' }),
        pb.collection('projects').getFullList({ sort: '-created' }),
        pb.collection('samples').getFullList({ sort: '-created' }),
        pb.collection('patterns').getFullList({ sort: '-created' }),
      ]);

      setYarns(yarnsData as any);
      setSamples(samplesData as any);

      // 1. Проекты: превращаем имена файлов в полные URL
      const parsedProjects = projectsData.map((p: any) => ({
        ...p,
        // Если photos есть, берем каждый файл и строим ссылку через pb.files.getURL
        photos: p.photos ? p.photos.map((filename: string) => pb.files.getURL(p, filename)) : [],
        // yarnUsages пока оставляем как JSON-строку (если поле Text)
        yarnUsages: typeof p.yarnUsages === 'string' ? JSON.parse(p.yarnUsages) : (p.yarnUsages || []),
      }));
      setProjects(parsedProjects);

      // 2. Схемы: превращаем имена файлов в полные URL
      const parsedPatterns = patternsData.map((p: any) => ({
        ...p,
        photos: p.photos ? p.photos.map((filename: string) => pb.files.getURL(p, filename)) : [],
        pdfs: p.pdfs ? p.pdfs.map((filename: string) => pb.files.getURL(p, filename)) : [],
      }));
      setPatterns(parsedPatterns);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Автоскролл наверх при переключении раздела
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);

  // Экран загрузки
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard yarns={yarns} projects={projects} samples={samples} patterns={patterns} />;
      case 'yarn':
        return <YarnSection yarns={yarns} projects={projects} searchQuery={searchQuery} onEdit={setEditingYarn} />;
      case 'projects':
        return <ProjectsSection projects={projects} yarns={yarns} searchQuery={searchQuery} onProjectUpdate={handleUpdateProject} />;
      case 'samples':
        return <SamplesSection samples={samples} yarns={yarns} searchQuery={searchQuery} onSampleUpdate={handleUpdateSample} />;
      case 'patterns':
        return <PatternsSection patterns={patterns} searchQuery={searchQuery} onPatternUpdate={handleUpdatePattern} />;
    }
  };

  const getCount = (section: Section) => {
    switch (section) {
      case 'dashboard': return null;
      case 'yarn': return yarns.length;
      case 'projects': return projects.length;
      case 'samples': return samples.length;
      case 'patterns': return patterns.length;
    }
  };

  const handleAddClick = () => {
    switch (activeSection) {
      case 'yarn':
        setShowAddYarn(true);
        break;
      case 'projects':
        setShowAddProject(true);
        break;
      case 'samples':
        setShowAddSample(true);
        break;
      case 'patterns':
        setShowAddPattern(true);
        break;
    }
  };

  const handleSaveYarn = async (yarn: Yarn) => {
    try {
      const created = await pb.collection('yarns').create(yarn);
      setYarns([created as any, ...yarns]);
      setShowAddYarn(false);
    } catch (error) {
      console.error('Ошибка сохранения пряжи:', error);
      alert('Не удалось сохранить пряжу');
    }
  };

  const handleUpdateYarn = async (updatedYarn: Yarn) => {
    try {
      const updated = await pb.collection('yarns').update(updatedYarn.id, updatedYarn);
      setYarns(yarns.map(y => y.id === updated.id ? updated as any : y));
      setEditingYarn(null);
    } catch (error) {
      console.error('Ошибка обновления пряжи:', error);
      alert('Не удалось обновить пряжу');
    }
  };

  const handleUpdateSample = async (updatedSample: Sample) => {
  try {
    await pb.collection('samples').update(updatedSample.id, updatedSample);
    // Обновляем локальный список
    setSamples(samples.map(s => s.id === updatedSample.id ? updatedSample : s));
    setEditingSample(null);
  } catch (error) {
    console.error('Ошибка обновления образца:', error);
    alert('Не удалось сохранить изменения');
  }
};

// Вспомогательная функция для удаления файлов через прямой fetch
const deleteFiles = async (collectionName: string, recordId: string, field: string, filenames: string[]) => {
  const url = `${pb.baseUrl}api/collections/${collectionName}/records/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${pb.authStore.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      [field]: filenames.map(f => '-' + f)
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete files');
  }
  
  return response.json();
};

// Вспомогательная функция для загрузки файлов через FormData
const uploadFiles = async (collectionName: string, recordId: string, field: string, files: File[]) => {
  const url = `${pb.baseUrl}api/collections/${collectionName}/records/${recordId}`;
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append(field, file);
  });
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${pb.authStore.token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload files');
  }
  
  return response.json();
};

// Вспомогательная функция для обновления текстовых полей
const updateRecord = async (collectionName: string, recordId: string, data: any) => {
  const url = `${pb.baseUrl}api/collections/${collectionName}/records/${recordId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${pb.authStore.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update record');
  }
  
  return response.json();
};

const handleUpdateProject = async (updatedProject: Project) => {
  try {
    const originalProject = projects.find(p => p.id === updatedProject.id);
    const originalPhotos = originalProject?.photos || [];

    const deletedPhotos = originalPhotos.filter(p => !updatedProject.photos.includes(p));
    const newPhotos = updatedProject.photos.filter(p => p.startsWith('data:'));

    console.log('=== ОБНОВЛЕНИЕ ПРОЕКТА ===');
    console.log('Удаляем фото:', deletedPhotos.length, 'шт');
    console.log('Новые фото:', newPhotos.length, 'шт');

    const baseUrl = (pb as any).baseUrl || 'https://woolfolio.ru';
    const token = pb.authStore.token;

    // Создаём ОДИН FormData для всех операций
    const formData = new FormData();

    // Текстовые поля
    formData.append('name', updatedProject.name);
    formData.append('stage', updatedProject.stage);
    formData.append('needleSize', String(updatedProject.needleSize));
    formData.append('startDate', updatedProject.startDate || '');
    formData.append('endDate', updatedProject.endDate || '');
    formData.append('notes', updatedProject.notes || '');
    formData.append('yarnUsages', JSON.stringify(updatedProject.yarnUsages || []));

    // Файлы для удаления (с префиксом -)
    if (deletedPhotos.length > 0) {
      deletedPhotos.forEach(url => {
        const filename = url.split('/').pop() || url;
        formData.append('photos', '-' + filename);
        console.log('Добавлено на удаление:', '-' + filename);
      });
    }

    // Новые файлы для загрузки
    if (newPhotos.length > 0) {
      newPhotos.forEach((photo, index) => {
        const file = base64ToFile(photo, `project_photo_${index}.jpg`);
        formData.append('photos', file);
        console.log('Добавлен новый файл:', file.name);
      });
    }

    console.log('Отправляем FormData...');

    // ОДИН запрос через fetch
    const response = await fetch(`${baseUrl}/api/collections/projects/records/${updatedProject.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type НЕ указываем!
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка ответа:', errorData);
      throw new Error(errorData.message || 'Не удалось сохранить изменения');
    }

    console.log('Успешно сохранено');

    await loadData();
    setEditingProject(null);
  } catch (error: any) {
    console.error('Ошибка обновления проекта:', error);
    alert(error.message || 'Не удалось сохранить изменения');
  }
};

const handleUpdatePattern = async (updatedPattern: Pattern) => {
  try {
    const originalPattern = patterns.find(p => p.id === updatedPattern.id);
    const originalPhotos = originalPattern?.photos || [];
    const originalPdfs = originalPattern?.pdfs || [];

    const deletedPhotos = originalPhotos.filter(p => !updatedPattern.photos.includes(p));
    const deletedPdfs = originalPdfs.filter(p => !updatedPattern.pdfs.includes(p));
    const newPhotos = updatedPattern.photos.filter(p => p.startsWith('data:'));
    const newPdfs = updatedPattern.pdfs.filter(p => p.startsWith('data:'));

    console.log('=== ОБНОВЛЕНИЕ СХЕМЫ ===');
    console.log('Удаляем фото:', deletedPhotos.length, 'шт');
    console.log('Удаляем PDF:', deletedPdfs.length, 'шт');
    console.log('Новые фото:', newPhotos.length, 'шт');
    console.log('Новые PDF:', newPdfs.length, 'шт');

    const baseUrl = (pb as any).baseUrl || 'https://woolfolio.ru';
    const token = pb.authStore.token;

    // Создаём ОДИН FormData
    const formData = new FormData();

    // Текстовые поля
    formData.append('name', updatedPattern.name);
    formData.append('link', updatedPattern.link || '');

    // Фото для удаления
    if (deletedPhotos.length > 0) {
      deletedPhotos.forEach(url => {
        const filename = url.split('/').pop() || url;
        formData.append('photos', '-' + filename);
      });
    }

    // Новые фото
    if (newPhotos.length > 0) {
      newPhotos.forEach((photo, index) => {
        const file = base64ToFile(photo, `pattern_photo_${index}.jpg`);
        formData.append('photos', file);
      });
    }

    // PDF для удаления
    if (deletedPdfs.length > 0) {
      deletedPdfs.forEach(url => {
        const filename = url.split('/').pop() || url;
        formData.append('pdfs', '-' + filename);
      });
    }

    // Новые PDF
    if (newPdfs.length > 0) {
      newPdfs.forEach((pdf, index) => {
        const file = base64ToFile(pdf, `pattern_doc_${index}.pdf`);
        formData.append('pdfs', file);
      });
    }

    console.log('Отправляем FormData...');

    const response = await fetch(`${baseUrl}/api/collections/patterns/records/${updatedPattern.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка ответа:', errorData);
      throw new Error(errorData.message || 'Не удалось сохранить изменения');
    }

    console.log('Успешно сохранено');

    await loadData();
    setEditingPattern(null);
  } catch (error: any) {
    console.error('Ошибка обновления схемы:', error);
    alert(error.message || 'Не удалось сохранить изменения');
  }
};
  
  const handleSaveProject = async (project: Project) => {
    try {
      const created = await pb.collection('projects').create(project);
      setProjects([created as any, ...projects]);
      setShowAddProject(false);
    } catch (error) {
      console.error('Ошибка сохранения проекта:', error);
      alert('Не удалось сохранить проект');
    }
  };

  const handleSaveSample = async (sample: Sample) => {
    try {
      const created = await pb.collection('samples').create(sample);
      setSamples([created as any, ...samples]);
      setShowAddSample(false);
    } catch (error) {
      console.error('Ошибка сохранения образца:', error);
      alert('Не удалось сохранить образец');
    }
  };

  const handleSavePattern = async (pattern: Pattern) => {
    try {
      const created = await pb.collection('patterns').create(pattern);
      setPatterns([created as any, ...patterns]);
      setShowAddPattern(false);
    } catch (error) {
      console.error('Ошибка сохранения схемы:', error);
      alert('Не удалось сохранить схему');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WoolFolio" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">WoolFolio</h1>
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
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {section.icon.startsWith('fas') ? (
                <i className={`${section.icon} text-base`}></i>
              ) : (
                <span className="text-base">{section.icon}</span>
              )}
              <span className="flex-1 text-left">{section.label}</span>
              {getCount(section.id) !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeSection === section.id ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {getCount(section.id)}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
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
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 shadow-xl ${
          mobileMenuOpen ? '' : 'transition-transform duration-300'
        }`}
        style={{
          transform: mobileMenuOpen
            ? 'translateX(0)'
            : `translateX(${swipeOffset - 264}px)`,
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WoolFolio" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">WoolFolio</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300"
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
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {section.icon.startsWith('fas') ? (
                <i className={`${section.icon} text-xs`}></i>
              ) : (
                <span className="text-sm">{section.icon}</span>
              )}
              <span className="flex-1 text-left">{section.label}</span>
              {getCount(section.id) !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeSection === section.id ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {getCount(section.id)}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div ref={mainRef} className="flex-1 md:ml-64 w-full" {...swipeHandlers}>
        {/* Swipe edge indicator */}
        <div
          className="md:hidden fixed top-0 left-0 w-1 h-full bg-emerald-500/20 z-30 pointer-events-none transition-opacity"
          style={{ opacity: swipeOffset > 0 ? 1 : 0 }}
        ></div>

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(true)}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>

              {/* Section Title */}
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
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
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Export button */}
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Экспорт данных"
                  >
                    <i className="fas fa-download"></i>
                  </button>
                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <button
                        onClick={() => {
                          exportToJSON({
                            yarns,
                            projects,
                            samples,
                            patterns,
                          });
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <i className="fas fa-file-code mr-2 text-emerald-500"></i>
                        Полный бэкап (JSON)
                      </button>
                      <button
                        onClick={() => {
                          exportYarnsToCSV(yarns, projects);
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <i className="fas fa-file-csv mr-2 text-emerald-500"></i>
                        Пряжа (CSV)
                      </button>
                      <button
                        onClick={() => {
                          exportProjectsToCSV(projects, yarns);
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <i className="fas fa-file-csv mr-2 text-emerald-500"></i>
                        Проекты (CSV)
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
                >
                  <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                </button>

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-200">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Выйти
                    </button>
                  </div>
                </div>

                {/* Add button */}
                {activeSection !== 'dashboard' && (
                  <button
                    onClick={handleAddClick}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    <span className="hidden sm:inline">Добавить</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          {renderSection()}
        </div>
      </div>

      {/* Формы добавления */}
      <AddYarnForm
        isOpen={showAddYarn}
        onClose={() => setShowAddYarn(false)}
        onSave={handleSaveYarn}
      />
      <AddProjectForm
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSave={handleSaveProject}
        yarns={yarns}
      />
      <AddSampleForm
        isOpen={showAddSample}
        onClose={() => setShowAddSample(false)}
        onSave={handleSaveSample}
        yarns={yarns}
      />
      <AddPatternForm
        isOpen={showAddPattern}
        onClose={() => setShowAddPattern(false)}
        onSave={handleSavePattern}
      />

      {/* Форма редактирования */}
      <EditYarnForm
        isOpen={!!editingYarn}
        onClose={() => setEditingYarn(null)}
        onSave={handleUpdateYarn}
        yarn={editingYarn}
      />
      <EditSampleForm
        isOpen={!!editingSample}
        onClose={() => setEditingSample(null)}
        onSave={handleUpdateSample}
        yarns={yarns}
        sample={editingSample}
      />

      <EditPatternForm
        isOpen={!!editingPattern}
        onClose={() => setEditingPattern(null)}
        onSave={handleUpdatePattern}
        pattern={editingPattern}
      />

      <EditProjectForm
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdateProject}
        yarns={yarns}
        project={editingProject}
      />
    </div>
  );
}

const AppWithProviders = () => (
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);

export default AppWithProviders;
