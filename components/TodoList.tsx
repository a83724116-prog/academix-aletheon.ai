
import React, { useState } from 'react';
import { Todo } from '../types';
import { CheckSquare, Trash2, Plus, Calendar, Tag, Filter, CheckCircle2, Circle } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, category: Todo['category']) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete, onAdd }) => {
  const [filter, setFilter] = useState<'All' | Todo['category']>('All');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<Todo['category']>('Study');

  const filtered = todos.filter(t => filter === 'All' || t.category === filter);

  // Calculate counts for badges
  const counts = {
    All: todos.length,
    Study: todos.filter(t => t.category === 'Study').length,
    Homework: todos.filter(t => t.category === 'Homework').length,
    Revision: todos.filter(t => t.category === 'Revision').length,
  };

  const categories = ['All', 'Study', 'Homework', 'Revision'] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newText, newCategory);
    setNewText('');
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 md:p-10 overflow-y-auto animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-2">
                <CheckSquare className="text-emerald-500" size={32} /> Task Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your daily goals and assignments.</p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-2 transition-all focus-within:shadow-md focus-within:border-emerald-500/50">
            <input 
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-slate-700 dark:text-slate-200 placeholder:font-normal placeholder:text-gray-400"
            />
            <div className="hidden md:flex items-center">
                <select 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="bg-gray-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors h-10 mr-2"
                >
                    <option value="Study">Study</option>
                    <option value="Homework">Homework</option>
                    <option value="Revision">Revision</option>
                </select>
            </div>
            <button type="submit" disabled={!newText.trim()} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <Plus size={20} />
            </button>
        </form>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Filter size={12} /> Filter:
            </span>
            {categories.map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`
                        px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-2
                        ${filter === f 
                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg border-transparent scale-105' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}
                    `}
                >
                    {f}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${filter === f ? 'bg-white/20 text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
                        {counts[f]}
                    </span>
                </button>
            ))}
        </div>

        {/* List */}
        <div className="space-y-3">
            {filtered.length === 0 ? (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <CheckSquare size={32} className="text-gray-400"/>
                    </div>
                    <p className="font-medium text-gray-500">No {filter === 'All' ? '' : filter} tasks found.</p>
                </div>
            ) : (
                filtered.map(todo => (
                    <div key={todo.id} className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-emerald-500/30 transition-all flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                        <button 
                            onClick={() => onToggle(todo.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${todo.completed ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-gray-300 dark:border-slate-600 hover:border-emerald-500'}`}
                        >
                            {todo.completed && <Check size={14} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className={`font-bold text-lg leading-tight transition-all truncate ${todo.completed ? 'text-gray-400 line-through decoration-2 decoration-gray-300 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                {todo.text}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                                    todo.category === 'Homework' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                    todo.category === 'Study' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                    <Tag size={10} fill="currentColor" /> {todo.category}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onDelete(todo.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

function Check({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )
}
