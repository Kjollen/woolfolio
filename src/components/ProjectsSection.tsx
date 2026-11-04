import React, { useState } from 'react';
import { Project, Yarn, YarnUsage } from '../types';
import { formatFoldedMeterage } from '../utils/yarnCalc';
import Modal from './Modal';
import PhotoGallery from './PhotoGallery';
import FilterBar from './FilterBar';
import EditProjectForm from './EditProjectForm'; // <--- 1. Импортируем форму

interface Props {
  projects: Project[];
  yarns: Yarn[];
  searchQuery: string;
  onProjectUpdate: (project: Project) => void; // <--- 2. Добавляем пропс для обновления
}

const stageLabels: Record<string, string> = {
  planned: 'В планах',
  in_progress: 'В процессе',
  completed: 'Завершено',
};

const stageColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

const ProjectsSection: React.FC<Props> = ({ projects, yarns, searchQuery, onProjectUpdate }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null); // <--- 3. Состояние редактирования
  const [sortBy, setSortBy] = useState('name');
  const [filterByStage, setFilterByStage] = useState('all');

  // ... (getProjectYarns и filteredProjects остаются без изменений) ...
  const getProjectYarns = (project: Project): Yarn[] =>
    project.yarnUsages
      .map((u) => yarns.find((y) => y.id === u.yarnId))
      .filter((y): y is Yarn => !!y);

  const filteredProjects = projects
    .filter((project) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const projectYarns = getProjectYarns(project);
      return (
        project.name.toLowerCase().includes(q) ||
        project.notes.toLowerCase().includes(q) ||
        stageLabels[project.stage].toLowerCase().includes(q) ||
        projectYarns.some(
          (y) =>
            y.name.toLowerCase().includes(q) ||
            y.manufacturer.toLowerCase().includes(q) ||
            y.color.toLowerCase().includes(q)
        )
      );
    })
    .filter((project) => {
      if (filterByStage === 'all') return true;
      return project.stage === filterByStage;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'startDate') return (b.startDate || '').localeCompare(a.startDate || '');
      if (sortBy === 'stage') return a.stage.localeCompare(b.stage);
      return 0;
    });

  // <--- 4. Обработчик сохранения
  const handleEditProject = (updatedProject: Project) => {
    onProjectUpdate(updatedProject);
    setEditingProject(null); // Закрываем форму после сохранения
  };

  return (
    <div>
      <FilterBar
        sortOptions={[
          { value: 'name', label: 'По названию' },
          { value: 'startDate', label: 'По дате' },
          { value: 'stage', label: 'По стадии' },
        ]}
        currentSort={sortBy}
        onChange={setSortBy}
        filters={[
          {
            label: 'Стадия',
            options: [
              { value: 'all', label: 'Все' },
              { value: 'planned', label: 'В планах' },
              { value: 'in_progress', label: 'В процессе' },
              { value: 'completed', label: 'Завершено' },
            ],
            value: filterByStage,
            onChange: setFilterByStage,
          },
        ]}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... (здесь твой код маппинга карточек filteredProjects.map, он не изменился) ... */}
        {filteredProjects.map((project) => {
          const projectYarns = getProjectYarns(project);
          return (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              {/* ... карточка проекта ... */}
              {project.photos.length > 0 ? (
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img src={project.photos[0]} alt={project.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  <i className="fas fa-image text-4xl text-emerald-200"></i>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{project.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${stageColors[project.stage]}`}>
                    {stageLabels[project.stage]}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {project.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="flex items-center justify-between gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded truncate flex-1">
                          {yarn.name}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          ×{usage.folds}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-600 uppercase tracking-wide font-medium">Толщина нити</span>
                    <span className="text-sm font-bold text-indigo-700">
                      {formatFoldedMeterage(project.yarnUsages, yarns)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Спицы: {project.needleSize} мм</span>
                  <span className="text-gray-400">
                    {project.yarnUsages.reduce((sum, u) => sum + (u.consumed || 0), 0) > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {project.yarnUsages.reduce((sum, u) => sum + (u.consumed || 0), 0)}г
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-search text-4xl mb-3"></i>
          <p>Ничего не найдено</p>
        </div>
      )}

      {/* Modal просмотра */}
      <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)}>
        {selectedProject && (
          <>
            {selectedProject.photos.length > 0 && (
              <PhotoGallery photos={selectedProject.photos} />
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-gray-800">{selectedProject.name}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColors[selectedProject.stage]}`}>
                  {stageLabels[selectedProject.stage]}
                </span>
              </div>
              
              {/* ... (здесь твой код отображения пряжи, толщины, дат и заметок - он не изменился) ... */}
              <div className="mt-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Пряжа и сложения</h3>
                <div className="space-y-2">
                  {selectedProject.yarnUsages.map((usage) => {
                    const yarn = yarns.find((y) => y.id === usage.yarnId);
                    if (!yarn) return null;
                    return (
                      <div key={usage.yarnId} className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-3">
                          <img src={yarn.photo} alt={yarn.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{yarn.name}</p>
                            <p className="text-xs text-gray-500">{yarn.manufacturer} • {yarn.color}</p>
                            <p className="text-xs text-gray-400">Метраж: {yarn.meterage} м/100г</p>
                          </div>
                          <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-emerald-600 uppercase tracking-wide">Сложений</span>
                            <span className="text-lg font-bold text-emerald-700">{usage.folds}</span>
                          </div>
                        </div>
                        {usage.consumed !== undefined && usage.consumed > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              <i className="fas fa-weight-hanging mr-1 text-gray-400"></i>
                              Расход на проект
                            </span>
                            <span className="text-sm font-bold text-gray-700">{usage.consumed} г</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <i className="fas fa-calculator text-indigo-500"></i>
                  <span className="text-xs text-indigo-600 uppercase tracking-wide font-medium">Итоговая толщина нити</span>
                </div>
                <p className="text-lg font-bold text-indigo-700 mt-1">
                  {formatFoldedMeterage(selectedProject.yarnUsages, yarns)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoItem label="Спицы" value={`${selectedProject.needleSize} мм`} />
                <InfoItem label="Дата начала" value={selectedProject.startDate || '—'} />
                <InfoItem label="Дата завершения" value={selectedProject.endDate || '—'} />
              </div>

              {selectedProject.notes && (
                <div className="mt-4">
                  <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-1">Заметки</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedProject.notes}</p>
                </div>
              )}

              {/* КНОПКИ */}
              <div className="mt-5 flex gap-2">
                <button 
                  onClick={() => setEditingProject(selectedProject)} // <--- 5. Вешаем клик!
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i> Редактировать
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* <--- 6. Рендерим саму форму редактирования (как в образцах) */}
      <EditProjectForm
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleEditProject}
        yarns={yarns}
        project={editingProject}
      />
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <p className="text-sm font-medium text-gray-700">{value}</p>
  </div>
);

export default ProjectsSection;
