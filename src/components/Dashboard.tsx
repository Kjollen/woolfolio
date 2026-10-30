import React from 'react';
import { Yarn, Project, Sample, Pattern } from '../types';
import { calcYarnRemaining, calcYarnConsumed } from '../data/mockData';

interface Props {
  yarns: Yarn[];
  projects: Project[];
  samples: Sample[];
  patterns: Pattern[];
}

const Dashboard: React.FC<Props> = ({ yarns, projects, samples, patterns }) => {
  // Статистика по пряже
  const totalYarnWeight = yarns.reduce((sum, y) => sum + y.totalWeight, 0);
  const totalRemaining = yarns.reduce((sum, y) => sum + calcYarnRemaining(y.id, y.totalWeight, projects), 0);
  const totalConsumed = totalYarnWeight - totalRemaining;

  // Статистика по проектам
  const projectsByStage = {
    planned: projects.filter(p => p.stage === 'planned').length,
    in_progress: projects.filter(p => p.stage === 'in_progress').length,
    completed: projects.filter(p => p.stage === 'completed').length,
  };

  // Топ пряжи по использованию
  const yarnUsage = yarns.map(y => ({
    yarn: y,
    consumed: calcYarnConsumed(y.id, projects),
  })).sort((a, b) => b.consumed - a.consumed).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Основные карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🧶"
          label="Видов пряжи"
          value={yarns.length}
          color="emerald"
        />
        <StatCard
          icon="📋"
          label="Проектов"
          value={projects.length}
          color="blue"
        />
        <StatCard
          icon="📐"
          label="Образцов"
          value={samples.length}
          color="purple"
        />
        <StatCard
          icon="📖"
          label="Схем"
          value={patterns.length}
          color="orange"
        />
      </div>

      {/* Пряжа */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          🧶 Запасы пряжи
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Общий вес</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalYarnWeight}г</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Остаток</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalRemaining}г</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide">Использовано</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{totalConsumed}г</p>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Использовано</span>
            <span>{Math.round((totalConsumed / totalYarnWeight) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(totalConsumed / totalYarnWeight) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Проекты по стадиям */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          📋 Проекты по стадиям
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <StageCard
            label="В планах"
            count={projectsByStage.planned}
            color="blue"
            icon="fas fa-lightbulb"
          />
          <StageCard
            label="В процессе"
            count={projectsByStage.in_progress}
            color="amber"
            icon="fas fa-spinner"
          />
          <StageCard
            label="Завершено"
            count={projectsByStage.completed}
            color="green"
            icon="fas fa-check-circle"
          />
        </div>
      </div>

      {/* Топ пряжи */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          🏆 Топ пряжи по использованию
        </h3>
        <div className="space-y-3">
          {yarnUsage.map(({ yarn, consumed }, index) => (
            <div key={yarn.id} className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">
                {index + 1}
              </span>
              <img src={yarn.photo} alt={yarn.name} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {yarn.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${(consumed / yarn.totalWeight) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {consumed}г / {yarn.totalWeight}г
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
};

const StageCard: React.FC<{
  label: string;
  count: number;
  color: string;
  icon: string;
}> = ({ label, count, color, icon }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    green: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-center`}>
      <i className={`${icon} text-2xl mb-2`}></i>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
};

export default Dashboard;
