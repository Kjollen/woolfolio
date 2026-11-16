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
console.log('🔵 APP.TSX ЗАГРУЖЕН');

// Превращает Base64 строку в File объект (быстрый вариант через fetch/Blob)
const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const blob = await fetch(base64).then((r) => r.blob());
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

// Извлекает имя файла из URL PocketBase
const extractFilename = (url: string): string => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
};

// Вспомогательные предикаты
const isDataUrl = (v: any): v is string => typeof v === 'string' && v.startsWith('data:');
const isUploadedFileUrl = (v: any): v is string =>
  typeof v === 'string' && v.includes('/api/files/');

// Загружает одно фото (base64 data-URL или обычный URL) в PocketBase как ФАЙЛ
// и возвращает URL загруженного файла. Отправляется один небольшой
// multipart-запрос с самим файлом — без base64-текста в полях записи.
const uploadPhotoValue = async (value: string, prefix: string, collection: string): Promise<string> => {
  if (!value) return '';
  if (!isDataUrl(value)) return value; // уже URL — ничего не делаем
  const isPdf = value.startsWith('data:application/pdf');
  const file = await base64ToFile(value, `${prefix}_${Date.now()}${isPdf ? '.pdf' : '.jpg'}`);
  const formData = new FormData();
  formData.append('file', file);
  const record = await pb.collection(collection).create(formData, { requestKey: null });
  return pb.files.getURL(record, record.file);
};

// Последовательная загрузка нескольких значений (по одному файлу за запрос),
// чтобы не «вешать» сервер параллельными тяжёлыми аплоадами.
const uploadPhotoValues = async (values: string[], prefix: string, collection: string): Promise<string[]> => {
  const result: string[] = [];
  for (let i = 0; i < values.length; i++) {
    result.push(await uploadPhotoValue(values[i], `${prefix}_${i}`, collection));
  }
  return result;
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
      if (value.includes(',') && !value.startsWith('[')) {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    }
  }
  return [];
};

function App() {
  console.log('🔵 ФУНКЦИЯ APP ВЫЗВАНА');
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

  // Функция для постраничной загрузки
const loadAllRecords = async (collection: string, sort: string = '-created') => {
  let allRecords: any[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await pb.collection(collection).getList(page, 100, { sort });
    allRecords = [...allRecords, ...res.items];
    totalPages = res.totalPages;
    page++;
  } while (page <= totalPages);
  return allRecords;
};

  // Загрузка данных из PocketBase
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Чистим «висящие» незавершённые запросы (например, после зависаний)
  useEffect(() => {
    try {
      pb.cancelRequestsWithPattern?.('*');
    } catch (e) { /* noop */ }
  }, []);

  // Безопасный парсинг массива URL/файлов из поля PocketBase
  const parseFilesField = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return safeParseArray(value).filter(Boolean);
  };

  const loadData = async () => {
    console.log('🟡 loadData вызвана, user:', user);
    setDataLoading(true);
    try {
      const [yarnsData, projectsData, samplesData, patternsData] = await Promise.all([
        loadAllRecords('yarns', '-created'),
        loadAllRecords('projects'),
        loadAllRecords('samples', '-created'),
        loadAllRecords('patterns'),
      ]);

      // Пряжа: фото — миниатюра файла photoFile либо URL из текстового поля photo
      const parsedYarns = yarnsData.map((y: any) => ({
        ...y,
        photo: y.photoFile
          ? pb.files.getURL(y, y.photoFile, { thumb: '400x0' })
          : (typeof y.photo === 'string' && y.photo ? y.photo : ''),
      }));
      if (mountedRef.current) setYarns(parsedYarns as any);

      // Образцы: превью из файловых полей либо из текстовых photoBefore/photoAfter
      const parsedSamples = samplesData.map((s: any) => ({
        ...s,
        photoBefore: s.photoBeforeFile
          ? pb.files.getURL(s, s.photoBeforeFile, { thumb: '400x0' })
          : (typeof s.photoBefore === 'string' && s.photoBefore ? s.photoBefore : ''),
        photoAfter: s.photoAfterFile
          ? pb.files.getURL(s, s.photoAfterFile, { thumb: '400x0' })
          : (typeof s.photoAfter === 'string' && s.photoAfter ? s.photoAfter : ''),
      }));
      if (mountedRef.current) setSamples(parsedSamples as any);

      // Проекты: БЕЗОПАСНЫЙ парсинг
      const parsedProjects = projectsData.map((p: any) => {
        let safeYarnUsages = [];
        if (p.yarnUsages) {
          if (typeof p.yarnUsages === 'string') {
            try { safeYarnUsages = JSON.parse(p.yarnUsages); }
            catch (e) { safeYarnUsages = []; }
          } else if (Array.isArray(p.yarnUsages)) {
            safeYarnUsages = p.yarnUsages;
          }
        }
        return {
          ...p,
          photos: parseFilesField(p.photos),
          yarnUsages: safeYarnUsages,
        };
      });
      if (mountedRef.current) setProjects(parsedProjects);

      // Схемы: БЕЗОПАСНЫЙ парсинг
      const parsedPatterns = patternsData.map((p: any) => ({
        ...p,
        photos: parseFilesField(p.photos),
        pdfs: parseFilesField(p.pdfs),
      }));
      if (mountedRef.current) setPatterns(parsedPatterns);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      if (mountedRef.current) setDataLoading(false);
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
  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <i className="fas fa-spinner fa-spin text-3xl text-emerald-500 mb-4"></i>
        <p className="text-gray-600 dark:text-gray-400">Загрузка данных...</p>
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
        return <YarnSection yarns={yarns} projects={projects} searchQuery={searchQuery} onEdit={setEditingYarn} onDelete={handleDeleteYarn} />;
      case 'projects':
        return <ProjectsSection projects={projects} yarns={yarns} searchQuery={searchQuery} onProjectUpdate={handleUpdateProject} onDelete={handleDeleteProject} />;
      case 'samples':
        return <SamplesSection samples={samples} yarns={yarns} searchQuery={searchQuery} onSampleUpdate={handleUpdateSample} onDelete={handleDeleteSample} />;
      case 'patterns':
        return <PatternsSection patterns={patterns} searchQuery={searchQuery} onPatternUpdate={handleUpdatePattern} onDelete={handleDeletePattern} />;
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
      case 'yarn': setShowAddYarn(true); break;
      case 'projects': setShowAddProject(true); break;
      case 'samples': setShowAddSample(true); break;
      case 'patterns': setShowAddPattern(true); break;
    }
  };

  // === ФУНКЦИИ СОХРАНЕНИЯ ===

  // Строит данные для отправки в PocketBase: фото-значения, пришедшие из
  // загрузчика как base64, сначала отправляются на сервер ОТДЕЛЬНЫМИ маленькими
  // запросами (по одному файлу), и в запись попадают только короткие URL.
  // Так создание/обновление карточки остаётся быстрым и не «вешает» сервер.
  const buildRecordData = async (obj: any, photoFields: string[], collection: string): Promise<any> => {
    // Сначала загружаем все новые файлы (base64) — по одному за запрос
    const uploadedUrls = new Map<string, string>(); // dataURL -> URL файла в PocketBase
    const collectValues: string[] = [];
    for (const field of photoFields) {
      const value = obj[field];
      if (Array.isArray(value)) collectValues.push(...value);
      else if (typeof value === 'string') collectValues.push(value);
    }
    for (const v of collectValues) {
      if (isDataUrl(v) && !uploadedUrls.has(v)) {
        const url = await uploadPhotoValue(v, collection, collection);
        uploadedUrls.set(v, url);
      }
    }

    const toJsonString = (v: any) => JSON.stringify(v ?? null);

    const data: any = {};
    for (const key of Object.keys(obj)) {
      if (key === 'id' || key === 'created' || key === 'updated') continue;
      let value = obj[key];
      if (photoFields.includes(key)) {
        if (Array.isArray(value)) {
          // Массивы фото (photos/pdfs) сохраняем как JSON-строку со списком URL
          value = toJsonString(
            value.map((v: string) => (isDataUrl(v) ? uploadedUrls.get(v) || '' : v)).filter(Boolean)
          );
        } else if (isUploadedFileUrl(value)) {
          // Уже загруженный файл PocketBase: поле Text хранит полный URL — оставляем как есть
        } else if (isDataUrl(value)) {
          value = uploadedUrls.get(value) || '';
        } else if (typeof value === 'string' && value.startsWith('data:')) {
          value = '';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Объекты/массивы (yarnUsages) PocketBase в текстовых полях хранит строками
        value = toJsonString(value);
      }
      data[key] = value;
    }
    return data;
  };

  const handleSaveYarn = async (yarn: Yarn) => {
    try {
      console.log('🟢 handleSaveYarn');
      const created = await pb.collection('yarns').create(
        await buildRecordData({ ...yarn, photoFile: '' }, ['photo'], 'yarns'),
        { requestKey: null }
      );
      await loadData();
      setShowAddYarn(false);
    } catch (error) {
      console.error('Ошибка сохранения пряжи:', error);
      alert('Не удалось сохранить пряжу');
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      console.log('🟢 handleSaveProject вызвана');
      await pb.collection('projects').create(
        await buildRecordData({ ...project }, ['photos'], 'projects'),
        { requestKey: null }
      );
      await loadData();
      setShowAddProject(false);
    } catch (error: any) {
      console.error('Ошибка сохранения проекта:', error);
      alert(error.message || 'Не удалось сохранить проект');
    }
  };

  const handleSaveSample = async (sample: Sample) => {
    try {
      console.log('🟢 handleSaveSample');
      await pb.collection('samples').create(
        await buildRecordData(
          { ...sample, photoBeforeFile: '', photoAfterFile: '' },
          ['photoBefore', 'photoAfter'],
          'samples'
        ),
        { requestKey: null }
      );
      await loadData();
      setShowAddSample(false);
    } catch (error) {
      console.error('Ошибка сохранения образца:', error);
      alert('Не удалось сохранить образец');
    }
  };

  const handleSavePattern = async (pattern: Pattern) => {
    try {
      console.log('🟢 handleSavePattern вызвана');
      await pb.collection('patterns').create(
        await buildRecordData({ ...pattern }, ['photos', 'pdfs'], 'patterns'),
        { requestKey: null }
      );
      await loadData();
      setShowAddPattern(false);
    } catch (error: any) {
      console.error('Ошибка сохранения схемы:', error);
      alert(error.message || 'Не удалось сохранить схему');
    }
  };

  // === ФУНКЦИИ РЕДАКТИРОВАНИЯ ===

  const handleUpdateYarn = async (updatedYarn: Yarn) => {
    try {
      console.log('🟢 handleUpdateYarn');
      await pb.collection('yarns').update(
        updatedYarn.id,
        await buildRecordData({ ...updatedYarn, photoFile: '' }, ['photo'], 'yarns'),
        { requestKey: null }
      );
      await loadData();
      setEditingYarn(null);
    } catch (error) {
      console.error('Ошибка обновления пряжи:', error);
      alert('Не удалось обновить пряжу');
    }
  };

  const handleUpdateSample = async (updatedSample: Sample) => {
    try {
      console.log('🟢 handleUpdateSample');
      await pb.collection('samples').update(
        updatedSample.id,
        await buildRecordData(
          { ...updatedSample, photoBeforeFile: '', photoAfterFile: '' },
          ['photoBefore', 'photoAfter'],
          'samples'
        ),
        { requestKey: null }
      );
      await loadData();
      setEditingSample(null);
    } catch (error) {
      console.error('Ошибка обновления образца:', error);
      alert('Не удалось сохранить изменения');
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      console.log('🟢 handleUpdateProject вызвана');
      await pb.collection('projects').update(
        updatedProject.id,
        await buildRecordData({ ...updatedProject }, ['photos'], 'projects'),
        { requestKey: null }
      );
      await loadData();
      setEditingProject(null);
    } catch (error: any) {
      console.error('Ошибка обновления проекта:', error);
      alert(error.message || 'Не удалось сохранить изменения');
    }
  };

  const handleUpdatePattern = async (updatedPattern: Pattern) => {
    try {
      console.log('🟢 handleUpdatePattern вызвана');
      await pb.collection('patterns').update(
        updatedPattern.id,
        await buildRecordData({ ...updatedPattern }, ['photos', 'pdfs'], 'patterns'),
        { requestKey: null }
      );
      await loadData();
      setEditingPattern(null);
    } catch (error: any) {
      console.error('Ошибка обновления схемы:', error);
      alert(error.message || 'Не удалось сохранить изменения');
    }
  };

  // === ФУНКЦИИ УДАЛЕНИЯ ===

  const handleDeleteYarn = async (id: string) => {
    if (!confirm('Удалить пряжу? Это действие нельзя отменить.')) return;
    try {
      await pb.collection('yarns').delete(id);
      setYarns(yarns.filter(y => y.id !== id));
    } catch (error: any) {
      console.error('Ошибка удаления пряжи:', error);
      alert(error.message || 'Не удалось удалить пряжу');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Удалить проект? Это действие нельзя отменить.')) return;
    try {
      await pb.collection('projects').delete(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Ошибка удаления проекта:', error);
      alert(error.message || 'Не удалось удалить проект');
    }
  };

  const handleDeleteSample = async (id: string) => {
    if (!confirm('Удалить образец? Это действие нельзя отменить.')) return;
    try {
      await pb.collection('samples').delete(id);
      setSamples(samples.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Ошибка удаления образца:', error);
      alert(error.message || 'Не удалось удалить образец');
    }
  };

  const handleDeletePattern = async (id: string) => {
    if (!confirm('Удалить схему? Это действие нельзя отменить.')) return;
    try {
      await pb.collection('patterns').delete(id);
      setPatterns(patterns.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Ошибка удаления схемы:', error);
      alert(error.message || 'Не удалось удалить схему');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-30">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WoolFolio" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">WoolFolio</h1>
          </div>
        </div>
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
                  activeSection === section.id
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {getCount(section.id)}
                </span>
              )}
            </button>
          ))}
        </nav>
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
                  activeSection === section.id
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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
        <div
          className="md:hidden fixed top-0 left-0 w-1 h-full bg-emerald-500/20 z-30 pointer-events-none transition-opacity"
          style={{ opacity: swipeOffset > 0 ? 1 : 0 }}
        ></div>

        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(true)}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>

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

              <div className="flex items-center gap-2">
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
                          exportToJSON({ yarns, projects, samples, patterns });
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

                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
                >
                  <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                </button>

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

        <div className="p-4 md:p-6">
          {renderSection()}
        </div>
      </div>

      {/* Формы добавления */}
      <AddYarnForm isOpen={showAddYarn} onClose={() => setShowAddYarn(false)} onSave={handleSaveYarn} />
      <AddProjectForm isOpen={showAddProject} onClose={() => setShowAddProject(false)} onSave={handleSaveProject} yarns={yarns} />
      <AddSampleForm isOpen={showAddSample} onClose={() => setShowAddSample(false)} onSave={handleSaveSample} yarns={yarns} />
      <AddPatternForm isOpen={showAddPattern} onClose={() => setShowAddPattern(false)} onSave={handleSavePattern} />

      {/* Формы редактирования */}
      <EditYarnForm isOpen={!!editingYarn} onClose={() => setEditingYarn(null)} onSave={handleUpdateYarn} yarn={editingYarn} />
      <EditSampleForm isOpen={!!editingSample} onClose={() => setEditingSample(null)} onSave={handleUpdateSample} yarns={yarns} sample={editingSample} />
      <EditPatternForm isOpen={!!editingPattern} onClose={() => setEditingPattern(null)} onSave={handleUpdatePattern} pattern={editingPattern} />
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
