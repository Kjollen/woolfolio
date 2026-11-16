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

// Вспомогательный предикат
const isDataUrl = (v: any): v is string => typeof v === 'string' && v.startsWith('data:');

// Полные имена полей схем коллекций (берутся с сервера один раз на коллекцию
// через /api/collections/{name}). Нужны, чтобы:
//  1) не отправлять PocketBase поля, которых нет в схеме (иначе 400
//     "Field ... is not defined");
//  2) различать строковые и ФАЙЛОВЫЕ поля (для файловых SDK должен получить
//     настоящий File/FileList, а не JSON-строку).
type ColSchema = { names: Set<string>; types: Map<string, string> };
const schemaCache = new Map<string, ColSchema>();
const getCollectionSchema = async (col: string): Promise<ColSchema | null> => {
  if (schemaCache.has(col)) return schemaCache.get(col)!;
  try {
    const res = await fetch(`${pb.baseURL}/api/collections/${col}`, {
      headers: { Authorization: (pb as any).authStore?.token || '' },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const fields: any[] = json?.fields || [];
    const names = new Set<string>();
    const types = new Map<string, string>();
    for (const f of fields) {
      if (f?.type === 'autobind' || f?.type === 'relation') continue;
      const n = f?.name;
      if (typeof n === 'string' && n && !names.has(n)) {
        names.add(n);
        types.set(n, String(f?.type || ''));
      }
    }
    const schema = { names, types };
    schemaCache.set(col, schema);
    return schema;
  } catch (e) {
    return null; // не удалось получить схему — будем осторожны
  }
};

// Пустая запись-«болванка» для определения имён полей в записи
const EMPTY_RECORD_JSON = JSON.stringify({});

// Извлекает из ответа PocketBase имя(названия) загруженного(ых) файла(ов)
const getFileNames = (rec: any, field: string): string[] => {
  const raw = rec?.get ? rec.get(field) : rec?.[field];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  return [String(raw)];
};

// Загружает ОДИН File в PocketBase как настоящий файл и возвращает его ПОЛНЫЙ
// URL. Быстрый путь: создаём пустую запись (без файлов) и сразу обновляем её
// multipart-запросом с файлом в нужном файловом поле — ровно так же, как это
// всегда работало в projects/patterns. Затем URL забирается через
// pb.files.getURL и временная запись удаляется. Никакого base64.
const uploadFileToPocketbase = async (file: File, collection: string, field: string): Promise<string> => {
  const schema = await getCollectionSchema(collection);
  if (schema && !schema.names.has(field)) {
    throw new Error(
      `В коллекции "${collection}" нет поля "${field}". ` +
      `Добавьте его в админ-панели PocketBase (тип File).`
    );
  }
  const col = pb.collection(collection);
  const rec: any = await col.create(JSON.parse(EMPTY_RECORD_JSON), { requestKey: null });
  let updated: any;
  try {
    const fd = new FormData();
    fd.append(field, file);
    updated = await col.update(rec.id, fd, { requestKey: null });
  } catch (e) {
    try { await col.delete(rec.id, { requestKey: null }); } catch (_) { /* не критично */ }
    throw e;
  }
  const names = getFileNames(updated, field);
  try { await col.delete(rec.id, { requestKey: null }); } catch (_) { /* не критично */ }
  if (names.length === 0) throw new Error('PocketBase не вернул имя загруженного файла');
  return pb.files.getURL(updated, names[0]);
};

// Превращает выбранные формы в значения для ФАЙЛОВЫХ полей maxSelect>1
// (photos в projects, photos/pdfs в patterns): настоящие File остаются File
// (SDK отправит их multipart-ом, как всегда работало в projects/patterns),
// data-URL конвертируется в Blob->File, уже загруженные URL/имя файлов
// сохраняются как строки (PocketBase при update принимает смесь имён и файлов).
const buildFieldValue = async (
  items: any[],
  collection: string,
  field: string
): Promise<Array<File | string>> => {
  const out: Array<File | string> = [];
  for (let i = 0; i < items.length; i++) {
    const v = items[i];
    if (!v) continue;
    if (v instanceof File) {
      out.push(v);
    } else if (typeof v === 'string' && isDataUrl(v)) {
      const blob = await fetch(v).then((r) => r.blob());
      out.push(new File([blob], `${field}_${Date.now()}_${i}.jpg`, { type: blob.type || 'image/jpeg' }));
    } else if (typeof v === 'string') {
      out.push(v); // уже URL или имя файла — оставим как есть
    }
  }
  return out;
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

  // Строит данные для отправки в PocketBase.
  // photoFields: [файловое поле, ...] для каждого фото карточки (в коллекциях
  // yarns/samples это настоящие файловые поля PocketBase: photoFile,
  // photoBeforeFile, photoAfterFile).
  // Логика:
  //  - если форма передала НАСТОЯЩИЙ File — он кладётся прямо в data и SDK
  //    отправит его multipart-запросом вместе с записью (быстрый путь, ровно
  //    как всегда работал в projects/patterns);
  //  - если там только data-URL (fallback) — конвертируем в Blob->File;
  //  - если это обычный URL (картинка из интернета) — загружаем его на сервер
  //    отдельным быстрым запросом и кладём имя файла;
  //  - при РЕДАКТИРОВАНИИ уже загруженные файлы передаём их ИМЕНАМИ (PocketBase
  //    по имени сохранит существующий файл, не удаляя его);
  //  - photos/pdfs (maxSelect>1) — смесь имён/URL старых файлов и новых File;
  //  - поля, которых нет в схеме коллекции, не отправляем вовсе (иначе 400).
  const buildRecordData = async (
    obj: any,
    photoFields: string[],
    collection: string,
    isUpdate = false
  ): Promise<any> => {
    const schema = await getCollectionSchema(collection);
    const has = (f: string) => !schema || schema.names.has(f);
    const isFileType = (f: string) => schema?.types.get(f) === 'file';

    const toJsonString = (v: any) => JSON.stringify(v ?? null);

    // Извлекает ИМЯ файла из полного URL PocketBase (или оставляет имя как есть)
    const toFileName = (v: string): string => {
      const m = v.match(/\/api\/files\/[^/]+\/[^/]+\/[^/?#]+/);
      if (m) return m[0].split('/').pop()!;
      return v.split('/').pop()?.split('?')[0] || v;
    };

    // Загружает data-URL / внешний URL на сервер, возвращает ИМЯ файла
    const uploadToFieldName = async (raw: string, field: string): Promise<string> => {
      let file: File;
      if (isDataUrl(raw)) {
        const blob = await fetch(raw).then((r) => r.blob());
        file = new File([blob], `${field}_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      } else {
        const res = await fetch(raw);
        const blob = await res.blob();
        file = new File([blob], `${field}_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      }
      const url = await uploadFileToPocketbase(file, collection, field);
      return toFileName(url);
    };

    const data: any = {};

    // 1) Одиночные фото-поля (файловые поля коллекций yarns/samples)
    for (const key of photoFields) {
      if (!has(key) || !isFileType(key)) continue;
      const raw = obj[key];
      if (raw instanceof File) {
        data[key] = raw; // быстрый multipart-путь
      } else if (typeof raw === 'string' && raw) {
        if (isUpdate) {
          data[key] = toFileName(raw); // сохранить уже загруженный файл
        } else if (isDataUrl(raw) || /^https?:\/\//.test(raw)) {
          data[key] = await uploadToFieldName(raw, key);
        }
      }
    }

    // 2) Остальные поля
    for (const key of Object.keys(obj)) {
      if (key === 'id' || key === 'created' || key === 'updated') continue;
      if (photoFields.includes(key)) continue;
      if (/File[s]?$/.test(key)) continue; // служебные поля форм (*Files)
      if (!has(key)) continue;
      let value = obj[key];
      if (isFileType(key) && Array.isArray(value)) {
        // Файловые поля с maxSelect>1 (photos в projects, photos/pdfs в
        // patterns): подставляем настоящие File туда, где они были выбраны в
        // форме, data-URL/внешние URL грузим на сервер, старые файлы при
        // update передаём именами — всё одним multipart-записевым запросом.
        const filesArr: any[] = obj[`${key}Files`] || [];
        const merged = value.map((v: any, i: number) => {
          const f = filesArr[i];
          return f instanceof File ? f : v;
        });
        const out: Array<File | string> = [];
        for (let i = 0; i < merged.length; i++) {
          const v = merged[i];
          if (!v) continue;
          if (v instanceof File) {
            out.push(v);
          } else if (typeof v === 'string' && v) {
            if (isDataUrl(v) || /^https?:\/\//.test(v)) {
              out.push(await uploadToFieldName(v, key));
            } else if (isUpdate) {
              out.push(toFileName(v)); // имя уже загруженного файла
            } else {
              out.push(v);
            }
          }
        }
        value = out;
      } else if (isFileType(key) && typeof value === 'string') {
        // одиночное файловое поле вне photoFields
        if (!value) {
          value = '';
        } else if (isUpdate) {
          value = toFileName(value);
        } else if (isDataUrl(value) || /^https?:\/\//.test(value)) {
          value = await uploadToFieldName(value, key);
        } else {
          continue; // непонятная строка — не отправляем в файловое поле
        }
      } else if (Array.isArray(value) && (key === 'photos' || key === 'pdfs')) {
        // совместимость: если поле вдруг строковое — сериализуем в JSON
        value = toJsonString(value);
      } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        value = toJsonString(value);
      }
      data[key] = value;
    }

    return data;
  };

  const handleSaveYarn = async (yarn: Yarn) => {
    try {
      console.log('🟢 handleSaveYarn');
      await pb.collection('yarns').create(
        await buildRecordData({ ...yarn, photoFile: yarn.photoFile ?? yarn.photo }, ['photoFile'], 'yarns'),
        { requestKey: null }
      );
      await loadData();
      setShowAddYarn(false);
    } catch (error: any) {
      console.error('Ошибка сохранения пряжи:', error);
      alert(error?.message || 'Не удалось сохранить пряжу');
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      console.log('🟢 handleSaveProject вызвана');
      await pb.collection('projects').create(
        await buildRecordData(project as any, [], 'projects'),
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
          {
            ...sample,
            photoBeforeFile: sample.photoBeforeFile ?? sample.photoBefore,
            photoAfterFile: sample.photoAfterFile ?? sample.photoAfter,
          },
          ['photoBeforeFile', 'photoAfterFile'],
          'samples'
        ),
        { requestKey: null }
      );
      await loadData();
      setShowAddSample(false);
    } catch (error: any) {
      console.error('Ошибка сохранения образца:', error);
      alert(error?.message || 'Не удалось сохранить образец');
    }
  };

  const handleSavePattern = async (pattern: Pattern) => {
    try {
      console.log('🟢 handleSavePattern вызвана');
      await pb.collection('patterns').create(
        await buildRecordData(pattern as any, [], 'patterns'),
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
        await buildRecordData({ ...updatedYarn, photoFile: updatedYarn.photoFile ?? updatedYarn.photo }, ['photoFile'], 'yarns', true),
        { requestKey: null }
      );
      await loadData();
      setEditingYarn(null);
    } catch (error: any) {
      console.error('Ошибка обновления пряжи:', error);
      alert(error?.message || 'Не удалось обновить пряжу');
    }
  };

  const handleUpdateSample = async (updatedSample: Sample) => {
    try {
      console.log('🟢 handleUpdateSample');
      await pb.collection('samples').update(
        updatedSample.id,
        await buildRecordData(
          {
            ...updatedSample,
            photoBeforeFile: updatedSample.photoBeforeFile ?? updatedSample.photoBefore,
            photoAfterFile: updatedSample.photoAfterFile ?? updatedSample.photoAfter,
          },
          ['photoBeforeFile', 'photoAfterFile'],
          'samples',
          true
        ),
        { requestKey: null }
      );
      await loadData();
      setEditingSample(null);
    } catch (error: any) {
      console.error('Ошибка обновления образца:', error);
      alert(error?.message || 'Не удалось сохранить изменения');
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      console.log('🟢 handleUpdateProject вызвана');
      await pb.collection('projects').update(
        updatedProject.id,
        await buildRecordData(updatedProject as any, [], 'projects', true),
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
        await buildRecordData(updatedPattern as any, [], 'patterns', true),
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
      setPatterns(patterns.filter(p => p.id !== p.id));
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
