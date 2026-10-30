import { Yarn, Project, Sample, Pattern } from '../types';
import { calcYarnRemaining } from '../data/mockData';

export function exportToJSON(data: {
  yarns: Yarn[];
  projects: Project[];
  samples: Sample[];
  patterns: Pattern[];
}) {
  const jsonData = JSON.stringify(data, null, 2);
  downloadFile(jsonData, 'woolfolio-backup.json', 'application/json');
}

export function exportYarnsToCSV(yarns: Yarn[], projects: Project[]) {
  const headers = [
    'Название',
    'Производитель',
    'Артикул',
    'Состав',
    'Цвет',
    'Общий вес (г)',
    'Метраж (м/100г)',
    'Общий метраж (м)',
    'Остаток (г)',
    'Магазин',
    '№ Заказа',
    'Цена за грамм (₽)',
    'Общая сумма (₽)',
  ];

  const rows = yarns.map((yarn) => [
    yarn.name,
    yarn.manufacturer,
    yarn.article,
    yarn.composition,
    yarn.color,
    yarn.totalWeight,
    yarn.meterage,
    yarn.totalMeterage,
    calcYarnRemaining(yarn.id, yarn.totalWeight, projects),
    yarn.shop,
    yarn.orderNumber,
    yarn.pricePerGram,
    yarn.totalPrice,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  downloadFile(csv, 'woolfolio-yarns.csv', 'text/csv');
}

export function exportProjectsToCSV(projects: Project[], yarns: Yarn[]) {
  const headers = [
    'Название',
    'Стадия',
    'Пряжа',
    'Спицы (мм)',
    'Дата начала',
    'Дата завершения',
    'Заметки',
  ];

  const stageLabels: Record<string, string> = {
    planned: 'В планах',
    in_progress: 'В процессе',
    completed: 'Завершено',
  };

  const rows = projects.map((project) => {
    const projectYarns = project.yarnUsages
      .map((u) => {
        const yarn = yarns.find((y) => y.id === u.yarnId);
        return yarn ? `${yarn.name} (×${u.folds})` : '';
      })
      .filter(Boolean)
      .join('; ');

    return [
      project.name,
      stageLabels[project.stage],
      projectYarns,
      project.needleSize,
      project.startDate || '',
      project.endDate || '',
      project.notes,
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  downloadFile(csv, 'woolfolio-projects.csv', 'text/csv');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
