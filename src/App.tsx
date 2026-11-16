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

// Превращает Base64 строку в File объект
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
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    console.log('🟡 loadData вызвана, user:', user);
    setDataLoading(true);
    try {
      // Списки полей БЕЗ старых Text photo-полей, НО с новыми File-полями
      const yarnFields = 'id,name,manufacturer,article,composition,color,totalWeight,meterage,totalMeterage,shop,orderNumber,pricePerGram,totalPrice,notes,photoFile,created,updated';
      const sampleFields = 'id,name,yarn,needleSize,stitchesWidthBefore,rowsHeightBefore,measurementWidthBefore,measurementHeightBefore,stitchesWidthAfter,rowsHeightAfter,measurementWidthAfter,measurementHeightAfter,yarnUsages,notes,photoBeforeFile,photoAfterFile,created,updated';

const [yarnsData, projectsData, samplesData, patternsData] = await Promise.all([
  loadAllRecords('yarns', '-created'),
  loadAllRecords('projects'),
  loadAllRecords('samples', '-created'),
  loadAllRecords('patterns'),
]);

// Пряжа: превью из photoFile
const parsedYarns = yarnsData.map((y: any) => ({
  ...y,
  photo: y.photoFile ? pb.files.getURL(y, y.photoFile, { thumb: '200x200' }) : null,
}));
setYarns(parsedYarns as any);

// Образцы: превью из photoBeforeFile и photoAfterFile
const parsedSamples = samplesData.map((s: any) => ({
  ...s,
  photoBefore: s.photoBeforeFile ? pb.files.getURL(s, s.photoBeforeFile, { thumb: '200x200' }) : null,
  photoAfter: s.photoAfterFile ? pb.files.getURL(s, s.photoAfterFile, { thumb: '200x200' }) : null,
}));
setSamples(parsedSamples as any);

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
          photos: Array.isArray(p.photos) ? p.photos.map((filename: string) => pb.files.getURL(p, filename)) : [],
          yarnUsages: safeYarnUsages,
        };
      });
      setProjects(parsedProjects);

      // Схемы: БЕЗОПАСНЫЙ парсинг
      const parsedPatterns = patternsData.map((p: any) => ({
        ...p,
        photos: Array.isArray(p.photos) ? p.photos.map((filename: string) => pb.files.getURL(p, filename)) : [],
        pdfs: Array.isArray(p.pdfs) ? p.pdfs.map((filename: string) => pb.files.getURL(p, filename)) : [],
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

  const handleSaveYarn = async (yarn: Yarn) => {
    try {
      console.log('🟢 handleSaveYarn, yarn:', yarn);
      // Проверяем, есть ли новое фото (base64)
      const newPhoto = (yarn as any).photo && typeof (yarn as any).photo === 'string' && (yarn as any).photo.startsWith('data:');
      const existingPhotoFile = (yarn as any).photoFile; // имя существующего файла

      if (newPhoto) {
        const formData = new FormData();
        formData.append('name', yarn.name);
        formData.append('manufacturer', yarn.manufacturer || '');
        formData.append('article', yarn.article || '');
        formData.append('composition', yarn.composition || '');
        formData.append('color', yarn.color || '');
        formData.append('totalWeight', String(yarn.totalWeight || 0));
        formData.append('meterage', String(yarn.meterage || 0));
        formData.append('totalMeterage', String(yarn.totalMeterage || 0));
        formData.append('shop', yarn.shop || '');
        formData.append('orderNumber', yarn.orderNumber || '');
        formData.append('pricePerGram', String(yarn.pricePerGram || 0));
        formData.append('totalPrice', String(yarn.totalPrice || 0));
        formData.append('notes', yarn.notes || '');
        formData.append('photoFile', base64ToFile((yarn as any).photo, `yarn_${Date.now()}.jpg`));

        const created = await pb.collection('yarns').create(formData);
        setYarns([created as any, ...yarns]);
      } else {
        const created = await pb.collection('yarns').create({
          name: yarn.name,
          manufacturer: yarn.manufacturer || '',
          article: yarn.article || '',
          composition: yarn.composition || '',
          color: yarn.color || '',
          totalWeight: yarn.totalWeight || 0,
          meterage: yarn.meterage || 0,
          totalMeterage: yarn.totalMeterage || 0,
          shop: yarn.shop || '',
          orderNumber: yarn.orderNumber || '',
          pricePerGram: yarn.pricePerGram || 0,
          totalPrice: yarn.totalPrice || 0,
          notes: yarn.notes || '',
          photoFile: existingPhotoFile || '',
        });
        setYarns([created as any, ...yarns]);
      }
      setShowAddYarn(false);
    } catch (error) {
      console.error('Ошибка сохранения пряжи:', error);
      alert('Не удалось сохранить пряжу');
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      console.log('🟢 handleSaveProject вызвана, project:', project);
      const newPhotos = project.photos.filter((p: string) => p.startsWith('data:'));
      const existingPhotos = project.photos.filter((p: string) => !p.startsWith('data:'));
      let createdRecord;
      if (newPhotos.length > 0) {
        const formData = new FormData();
        formData.append('name', project.name);
        formData.append('stage', project.stage);
        formData.append('needleSize', String(project.needleSize || 0));
        formData.append('startDate', project.startDate || '');
        formData.append('endDate', project.endDate || '');
        formData.append('notes', project.notes || '');
        formData.append('yarnUsages', JSON.stringify(project.yarnUsages || []));
        newPhotos.forEach((photo: string, index: number) => {
          const file = base64ToFile(photo, `project_photo_${index}.jpg`);
          formData.append('photos', file);
        });
        createdRecord = await pb.collection('projects').create(formData);
      } else {
        createdRecord = await pb.collection('projects').create({
          name: project.name,
          stage: project.stage,
          needleSize: project.needleSize,
          startDate: project.startDate,
          endDate: project.endDate,
          notes: project.notes,
          yarnUsages: JSON.stringify(project.yarnUsages || []),
          photos: existingPhotos.map((url: string) => url.split('/').pop() || url),
        });
      }
      if (existingPhotos.length > 0 && newPhotos.length > 0) {
        const photoFilenames = existingPhotos.map((url: string) => url.split('/').pop() || url);
        await pb.collection('projects').update(createdRecord.id, {
          photos: photoFilenames,
        });
      }
      await loadData();
      setShowAddProject(false);
    } catch (error: any) {
      console.error('Ошибка сохранения проекта:', error);
      alert(error.message || 'Не удалось сохранить проект');
    }
  };

  const handleSaveSample = async (sample: Sample) => {
    try {
      console.log('🟢 handleSaveSample, sample:', sample);
      const newPhotoBefore = (sample as any).photoBefore && typeof (sample as any).photoBefore === 'string' && (sample as any).photoBefore.startsWith('data:');
      const newPhotoAfter = (sample as any).photoAfter && typeof (sample as any).photoAfter === 'string' && (sample as any).photoAfter.startsWith('data:');

      if (newPhotoBefore || newPhotoAfter) {
        const formData = new FormData();
        formData.append('name', sample.name);
        formData.append('yarn', sample.yarn || '');
        formData.append('needleSize', String(sample.needleSize || 0));
        formData.append('stitchesWidthBefore', String((sample as any).stitchesWidthBefore || 0));
        formData.append('rowsHeightBefore', String((sample as any).rowsHeightBefore || 0));
        formData.append('measurementWidthBefore', String((sample as any).measurementWidthBefore || 0));
        formData.append('measurementHeightBefore', String((sample as any).measurementHeightBefore || 0));
        formData.append('stitchesWidthAfter', String((sample as any).stitchesWidthAfter || 0));
        formData.append('rowsHeightAfter', String((sample as any).rowsHeightAfter || 0));
        formData.append('measurementWidthAfter', String((sample as any).measurementWidthAfter || 0));
        formData.append('measurementHeightAfter', String((sample as any).measurementHeightAfter || 0));
        formData.append('yarnUsages', JSON.stringify((sample as any).yarnUsages || []));
        formData.append('notes', (sample as any).notes || '');

        if (newPhotoBefore) {
          formData.append('photoBeforeFile', base64ToFile((sample as any).photoBefore, `sample_before_${Date.now()}.jpg`));
        }
        if (newPhotoAfter) {
          formData.append('photoAfterFile', base64ToFile((sample as any).photoAfter, `sample_after_${Date.now()}.jpg`));
        }

        const created = await pb.collection('samples').create(formData);
        setSamples([created as any, ...samples]);
      } else {
        const created = await pb.collection('samples').create({
          name: sample.name,
          yarn: sample.yarn || '',
          needleSize: sample.needleSize || 0,
          stitchesWidthBefore: (sample as any).stitchesWidthBefore || 0,
          rowsHeightBefore: (sample as any).rowsHeightBefore || 0,
          measurementWidthBefore: (sample as any).measurementWidthBefore || 0,
          measurementHeightBefore: (sample as any).measurementHeightBefore || 0,
          stitchesWidthAfter: (sample as any).stitchesWidthAfter || 0,
          rowsHeightAfter: (sample as any).rowsHeightAfter || 0,
          measurementWidthAfter: (sample as any).measurementWidthAfter || 0,
          measurementHeightAfter: (sample as any).measurementHeightAfter || 0,
          yarnUsages: JSON.stringify((sample as any).yarnUsages || []),
          notes: (sample as any).notes || '',
        });
        setSamples([created as any, ...samples]);
      }
      setShowAddSample(false);
    } catch (error) {
      console.error('Ошибка сохранения образца:', error);
      alert('Не удалось сохранить образец');
    }
  };

  const handleSavePattern = async (pattern: Pattern) => {
    try {
      console.log('🟢 handleSavePattern вызвана, pattern:', pattern);
      const newPhotos = pattern.photos.filter((p: string) => p.startsWith('data:'));
      const newPdfs = pattern.pdfs.filter((p: string) => p.startsWith('data:'));
      const existingPhotos = pattern.photos.filter((p: string) => !p.startsWith('data:'));
      const existingPdfs = pattern.pdfs.filter((p: string) => !p.startsWith('data:'));
      let createdRecord;
      if (newPhotos.length > 0 || newPdfs.length > 0) {
        const formData = new FormData();
        formData.append('name', pattern.name);
        formData.append('link', pattern.link || '');
        newPhotos.forEach((photo: string, index: number) => {
          const file = base64ToFile(photo, `pattern_photo_${index}.jpg`);
          formData.append('photos', file);
        });
        newPdfs.forEach((pdf: string, index: number) => {
          const file = base64ToFile(pdf, `pattern_doc_${index}.pdf`);
          formData.append('pdfs', file);
        });
        createdRecord = await pb.collection('patterns').create(formData);
      } else {
        createdRecord = await pb.collection('patterns').create({
          name: pattern.name,
          link: pattern.link || '',
          photos: existingPhotos.map((url: string) => url.split('/').pop() || url),
          pdfs: existingPdfs.map((url: string) => url.split('/').pop() || url),
        });
      }
      if ((existingPhotos.length > 0 || existingPdfs.length > 0) && (newPhotos.length > 0 || newPdfs.length > 0)) {
        const updateData: any = {};
        if (existingPhotos.length > 0) {
          updateData.photos = existingPhotos.map((url: string) => url.split('/').pop() || url);
        }
        if (existingPdfs.length > 0) {
          updateData.pdfs = existingPdfs.map((url: string) => url.split('/').pop() || url);
        }
        await pb.collection('patterns').update(createdRecord.id, updateData);
      }
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
      console.log('🟢 handleUpdateYarn, updatedYarn:', updatedYarn);
      const newPhoto = (updatedYarn as any).photo && typeof (updatedYarn as any).photo === 'string' && (updatedYarn as any).photo.startsWith('data:');
      const existingPhotoFile = (updatedYarn as any).photoFile; // имя существующего файла

      if (newPhoto) {
        const formData = new FormData();
        formData.append('name', updatedYarn.name);
        formData.append('manufacturer', updatedYarn.manufacturer || '');
        formData.append('article', updatedYarn.article || '');
        formData.append('composition', updatedYarn.composition || '');
        formData.append('color', updatedYarn.color || '');
        formData.append('totalWeight', String(updatedYarn.totalWeight || 0));
        formData.append('meterage', String(updatedYarn.meterage || 0));
        formData.append('totalMeterage', String(updatedYarn.totalMeterage || 0));
        formData.append('shop', updatedYarn.shop || '');
        formData.append('orderNumber', updatedYarn.orderNumber || '');
        formData.append('pricePerGram', String(updatedYarn.pricePerGram || 0));
        formData.append('totalPrice', String(updatedYarn.totalPrice || 0));
        formData.append('notes', updatedYarn.notes || '');
        formData.append('photoFile', base64ToFile((updatedYarn as any).photo, `yarn_${updatedYarn.id}.jpg`));

        const updated = await pb.collection('yarns').update(updatedYarn.id, formData);
        setYarns(yarns.map(y => y.id === updated.id ? updated as any : y));
      } else {
        const updated = await pb.collection('yarns').update(updatedYarn.id, {
          name: updatedYarn.name,
          manufacturer: updatedYarn.manufacturer || '',
          article: updatedYarn.article || '',
          composition: updatedYarn.composition || '',
          color: updatedYarn.color || '',
          totalWeight: updatedYarn.totalWeight || 0,
          meterage: updatedYarn.meterage || 0,
          totalMeterage: updatedYarn.totalMeterage || 0,
          shop: updatedYarn.shop || '',
          orderNumber: updatedYarn.orderNumber || '',
          pricePerGram: updatedYarn.pricePerGram || 0,
          totalPrice: updatedYarn.totalPrice || 0,
          notes: updatedYarn.notes || '',
          photoFile: existingPhotoFile || '',
        });
        setYarns(yarns.map(y => y.id === updated.id ? updated as any : y));
      }
      setEditingYarn(null);
    } catch (error) {
      console.error('Ошибка обновления пряжи:', error);
      alert('Не удалось обновить пряжу');
    }
  };

  const handleUpdateSample = async (updatedSample: Sample) => {
    try {
      console.log('🟢 handleUpdateSample, updatedSample:', updatedSample);
      const newPhotoBefore = (updatedSample as any).photoBefore && typeof (updatedSample as any).photoBefore === 'string' && (updatedSample as any).photoBefore.startsWith('data:');
      const newPhotoAfter = (updatedSample as any).photoAfter && typeof (updatedSample as any).photoAfter === 'string' && (updatedSample as any).photoAfter.startsWith('data:');
      const existingPhotoBeforeFile = (updatedSample as any).photoBeforeFile;
      const existingPhotoAfterFile = (updatedSample as any).photoAfterFile;

      if (newPhotoBefore || newPhotoAfter) {
        const formData = new FormData();
        formData.append('name', updatedSample.name);
        formData.append('yarn', updatedSample.yarn || '');
        formData.append('needleSize', String(updatedSample.needleSize || 0));
        formData.append('stitchesWidthBefore', String((updatedSample as any).stitchesWidthBefore || 0));
        formData.append('rowsHeightBefore', String((updatedSample as any).rowsHeightBefore || 0));
        formData.append('measurementWidthBefore', String((updatedSample as any).measurementWidthBefore || 0));
        formData.append('measurementHeightBefore', String((updatedSample as any).measurementHeightBefore || 0));
        formData.append('stitchesWidthAfter', String((updatedSample as any).stitchesWidthAfter || 0));
        formData.append('rowsHeightAfter', String((updatedSample as any).rowsHeightAfter || 0));
        formData.append('measurementWidthAfter', String((updatedSample as any).measurementWidthAfter || 0));
        formData.append('measurementHeightAfter', String((updatedSample as any).measurementHeightAfter || 0));
        formData.append('yarnUsages', JSON.stringify((updatedSample as any).yarnUsages || []));
        formData.append('notes', (updatedSample as any).notes || '');

        if (newPhotoBefore) {
          formData.append('photoBeforeFile', base64ToFile((updatedSample as any).photoBefore, `sample_${updatedSample.id}_before.jpg`));
        }
        if (newPhotoAfter) {
          formData.append('photoAfterFile', base64ToFile((updatedSample as any).photoAfter, `sample_${updatedSample.id}_after.jpg`));
        }

        const updated = await pb.collection('samples').update(updatedSample.id, formData);
        setSamples(samples.map(s => s.id === updatedSample.id ? updated as any : s));
      } else {
        const updated = await pb.collection('samples').update(updatedSample.id, {
          name: updatedSample.name,
          yarn: updatedSample.yarn || '',
          needleSize: updatedSample.needleSize || 0,
          stitchesWidthBefore: (updatedSample as any).stitchesWidthBefore || 0,
          rowsHeightBefore: (updatedSample as any).rowsHeightBefore || 0,
          measurementWidthBefore: (updatedSample as any).measurementWidthBefore || 0,
          measurementHeightBefore: (updatedSample as any).measurementHeightBefore || 0,
          stitchesWidthAfter: (updatedSample as any).stitchesWidthAfter || 0,
          rowsHeightAfter: (updatedSample as any).rowsHeightAfter || 0,
          measurementWidthAfter: (updatedSample as any).measurementWidthAfter || 0,
          measurementHeightAfter: (updatedSample as any).measurementHeightAfter || 0,
          yarnUsages: JSON.stringify((updatedSample as any).yarnUsages || []),
          notes: (updatedSample as any).notes || '',
          photoBeforeFile: existingPhotoBeforeFile || '',
          photoAfterFile: existingPhotoAfterFile || '',
        });
        setSamples(samples.map(s => s.id === updatedSample.id ? updated as any : s));
      }
      setEditingSample(null);
    } catch (error) {
      console.error('Ошибка обновления образца:', error);
      alert('Не удалось сохранить изменения');
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      console.log('🟢 handleUpdateProject вызвана, updatedProject:', updatedProject);
      const newPhotos = updatedProject.photos.filter((p: string) => p.startsWith('data:'));
      const existingPhotos = updatedProject.photos.filter((p: string) => !p.startsWith('data:'));
      let allPhotoFilenames: string[] = [];
      if (newPhotos.length > 0) {
        const formData = new FormData();
        newPhotos.forEach((photo: string, index: number) => {
          const file = base64ToFile(photo, `project_photo_${index}.jpg`);
          formData.append('photos', file);
        });
        const uploadResponse = await pb.collection('projects').update(updatedProject.id, formData);
        console.log('🟢 Ответ после загрузки файлов:', uploadResponse);
        if (uploadResponse.photos && Array.isArray(uploadResponse.photos)) {
          allPhotoFilenames = [...uploadResponse.photos];
        }
      }
      const existingFilenames = existingPhotos.map((url: string) => url.split('/').pop() || url);
      allPhotoFilenames = [...allPhotoFilenames, ...existingFilenames];
      console.log('🟢 Итоговый список файлов:', allPhotoFilenames);
      await pb.collection('projects').update(updatedProject.id, {
        name: updatedProject.name,
        stage: updatedProject.stage,
        needleSize: updatedProject.needleSize,
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate,
        notes: updatedProject.notes,
        yarnUsages: JSON.stringify(updatedProject.yarnUsages || []),
        photos: allPhotoFilenames,
      });
      await loadData();
      setEditingProject(null);
    } catch (error: any) {
      console.error('Ошибка обновления проекта:', error);
      alert(error.message || 'Не удалось сохранить изменения');
    }
  };

  const handleUpdatePattern = async (updatedPattern: Pattern) => {
    try {
      console.log('🟢 handleUpdatePattern вызвана, updatedPattern:', updatedPattern);
      const newPhotos = updatedPattern.photos.filter((p: string) => p.startsWith('data:'));
      const newPdfs = updatedPattern.pdfs.filter((p: string) => p.startsWith('data:'));
      const existingPhotos = updatedPattern.photos.filter((p: string) => !p.startsWith('data:'));
      const existingPdfs = updatedPattern.pdfs.filter((p: string) => !p.startsWith('data:'));
      let allPhotoFilenames: string[] = [];
      let allPdfFilenames: string[] = [];
      if (newPhotos.length > 0 || newPdfs.length > 0) {
        const formData = new FormData();
        newPhotos.forEach((photo: string, index: number) => {
          formData.append('photos', base64ToFile(photo, `pattern_photo_${index}.jpg`));
        });
        newPdfs.forEach((pdf: string, index: number) => {
          formData.append('pdfs', base64ToFile(pdf, `pattern_doc_${index}.pdf`));
        });
        const uploadResponse = await pb.collection('patterns').update(updatedPattern.id, formData);
        console.log('🟢 Ответ после загрузки файлов:', uploadResponse);
        if (uploadResponse.photos && Array.isArray(uploadResponse.photos)) {
          allPhotoFilenames = [...uploadResponse.photos];
        }
        if (uploadResponse.pdfs && Array.isArray(uploadResponse.pdfs)) {
          allPdfFilenames = [...uploadResponse.pdfs];
        }
      }
      const existingPhotoFilenames = existingPhotos.map((url: string) => url.split('/').pop() || url);
      const existingPdfFilenames = existingPdfs.map((url: string) => url.split('/').pop() || url);
      allPhotoFilenames = [...allPhotoFilenames, ...existingPhotoFilenames];
      allPdfFilenames = [...allPdfFilenames, ...existingPdfFilenames];
      console.log('🟢 Итоговый список фото:', allPhotoFilenames);
      console.log('🟢 Итоговый список PDF:', allPdfFilenames);
      await pb.collection('patterns').update(updatedPattern.id, {
        name: updatedPattern.name,
        link: updatedPattern.link || '',
        photos: allPhotoFilenames,
        pdfs: allPdfFilenames,
      });
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
