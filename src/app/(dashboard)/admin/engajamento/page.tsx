'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Badge } from '@/components/ui';
import { getAllTasks, updateTask, createTask, getEngagementStats, type EngagementTask } from '@/actions/engagement';
import { Heart, Plus, Check, X, Pencil, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { value: 'profile', label: 'Perfil', color: 'blue' },
  { value: 'content', label: 'Conteúdo', color: 'green' },
  { value: 'social', label: 'Social', color: 'purple' },
  { value: 'engagement', label: 'Engajamento', color: 'orange' },
  { value: 'special', label: 'Especial', color: 'pink' },
];

export default function EngajamentoAdminPage() {
  const [tasks, setTasks] = useState<EngagementTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EngagementTask>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTask, setNewTask] = useState({
    slug: '',
    name: '',
    description: '',
    category: 'profile',
    hearts_reward: 1,
    is_repeatable: false,
    max_per_day: undefined as number | undefined,
  });
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    totalCompletions: 0,
    heartsDistributed: 0,
    topTasks: [] as { name: string; completions: number }[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [tasksData, statsData] = await Promise.all([
      getAllTasks(),
      getEngagementStats(),
    ]);
    setTasks(tasksData);
    setStats(statsData);
    setLoading(false);
  }

  async function handleToggleActive(task: EngagementTask) {
    const result = await updateTask(task.id, { is_active: !task.is_active });
    if (result.success) {
      loadData();
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const result = await updateTask(editingId, editForm);
    if (result.success) {
      setEditingId(null);
      setEditForm({});
      loadData();
    }
  }

  async function handleCreateTask() {
    const result = await createTask(newTask);
    if (result.success) {
      setShowNewForm(false);
      setNewTask({
        slug: '',
        name: '',
        description: '',
        category: 'profile',
        hearts_reward: 1,
        is_repeatable: false,
        max_per_day: undefined,
      });
      loadData();
    } else {
      alert(result.error);
    }
  }

  function startEdit(task: EngagementTask) {
    setEditingId(task.id);
    setEditForm({
      name: task.name,
      description: task.description,
      hearts_reward: task.hearts_reward,
      is_repeatable: task.is_repeatable,
      max_per_day: task.max_per_day,
    });
  }

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'gray';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Engajamento" />
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas de Engajamento"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Engajamento' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Tarefas Ativas</div>
          <div className="text-2xl font-bold">{stats.activeTasks}/{stats.totalTasks}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Completions</div>
          <div className="text-2xl font-bold">{stats.totalCompletions.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Heart className="w-4 h-4 text-pink-500" />
            Distribuídos
          </div>
          <div className="text-2xl font-bold text-pink-500">{stats.heartsDistributed.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Top Tarefa
          </div>
          <div className="text-lg font-medium truncate">
            {stats.topTasks[0]?.name || 'N/A'}
          </div>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* New Task Form */}
      {showNewForm && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Nova Tarefa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Slug (único)"
              value={newTask.slug}
              onChange={(e) => setNewTask(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="ex: content_share"
            />
            <Input
              label="Nome"
              value={newTask.name}
              onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ex: Compartilhar post"
            />
            <Input
              label="Descrição"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="ex: Compartilhar um post nas redes"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Corações"
              type="number"
              min={1}
              value={newTask.hearts_reward}
              onChange={(e) => setNewTask(prev => ({ ...prev, hearts_reward: parseInt(e.target.value) || 1 }))}
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTask.is_repeatable}
                  onChange={(e) => setNewTask(prev => ({ ...prev, is_repeatable: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Repetível</span>
              </label>
              {newTask.is_repeatable && (
                <Input
                  label="Limite/dia"
                  type="number"
                  min={1}
                  value={newTask.max_per_day || ''}
                  onChange={(e) => setNewTask(prev => ({ 
                    ...prev, 
                    max_per_day: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-24"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreateTask}>Criar</Button>
          </div>
        </Card>
      )}

      {/* Tasks by Category */}
      {CATEGORIES.map(category => {
        const categoryTasks = tasks.filter(t => t.category === category.value);
        if (categoryTasks.length === 0) return null;

        return (
          <Card key={category.value} className="overflow-hidden">
            <div className={`px-4 py-2 bg-${category.color}-50 border-b`}>
              <h3 className="font-medium text-gray-900">{category.label}</h3>
            </div>
            <div className="divide-y">
              {categoryTasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  {editingId === task.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Nome"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          label="Corações"
                          type="number"
                          min={1}
                          value={editForm.hearts_reward || 1}
                          onChange={(e) => setEditForm(prev => ({ ...prev, hearts_reward: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <Input
                        label="Descrição"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_repeatable || false}
                            onChange={(e) => setEditForm(prev => ({ ...prev, is_repeatable: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm">Repetível</span>
                        </label>
                        {editForm.is_repeatable && (
                          <Input
                            label="Limite/dia"
                            type="number"
                            min={1}
                            value={editForm.max_per_day || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              max_per_day: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                            className="w-24"
                          />
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!task.is_active ? 'text-gray-400' : ''}`}>
                            {task.name}
                          </span>
                          {task.is_repeatable && (
                            <Badge variant="default" className="text-xs">Repetível</Badge>
                          )}
                          {!task.is_active && (
                            <Badge variant="default" className="text-xs bg-gray-100">Inativo</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{task.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          slug: {task.slug}
                          {task.max_per_day && ` • limite: ${task.max_per_day}/dia`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-pink-500">
                          <Heart className="w-4 h-4 fill-current" />
                          <span className="font-medium">{task.hearts_reward}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(task)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={task.is_active ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleActive(task)}
                          >
                            {task.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
