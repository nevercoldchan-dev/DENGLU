import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Map as MapIcon, 
  Play, 
  ChevronRight, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Move, 
  Activity,
  ChevronDown,
  ChevronUp,
  Terminal,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Search,
  Cpu,
  Workflow,
  Database,
  X,
  Maximize2,
  Minimize2,
  Wind,
  MoreHorizontal,
  Accessibility,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Waypoint, Task, INITIAL_PROMPT } from './types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initial 10 waypoints based on Image 4 style
const INITIAL_WAYPOINTS: Waypoint[] = [
  { id: '1', x: 20, y: 40, name: '环视录像', tasks: [] },
  { id: '2', x: 20, y: 20, name: '公司历...', tasks: [] },
  { id: '3', x: 50, y: 30, name: '机器人...', tasks: [] },
  { id: '4', x: 80, y: 20, name: '智能座舱', tasks: [] },
  { id: '5', x: 80, y: 60, name: '递瓶装水', tasks: [] },
  { id: '6', x: 55, y: 75, name: '金融政策', tasks: [] },
  { id: '7', x: 50, y: 55, name: '智能驾驶', tasks: [] },
  { id: '8', x: 20, y: 75, name: '下蹲比心', tasks: [] },
  { id: '9', x: 40, y: 15, name: '入口接待', tasks: [] },
  { id: '10', x: 70, y: 85, name: '出口欢送', tasks: [] },
];

export default function App() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]); // Order of points for route

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const updatePoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addTask = (pointId: string, type: Task['type']) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'speech' ? '您好，欢迎光临！' : 
               type === 'chat' ? '进入自由对话模式' :
               type === 'move' ? '移动到指定点位' :
               type === 'wait' ? '等待 3 秒' : '面向用户',
      actionType: 'none',
      targetId: type === 'move' ? '1' : undefined,
      duration: type === 'wait' ? 3 : undefined
    };
    setWaypoints(waypoints.map(p => {
      if (p.id === pointId) {
        // If adding a task, ensure the point is in the sequence
        if (!sequence.includes(pointId)) {
          setSequence(prev => [...prev, pointId]);
        }
        return { ...p, tasks: [...p.tasks, newTask] };
      }
      return p;
    }));
    
    addLog(`点位 ${pointId} 添加了新任务: ${type}`);
  };

  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    const newSequence = [...sequence];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSequence.length) return;
    
    [newSequence[index], newSequence[targetIndex]] = [newSequence[targetIndex], newSequence[index]];
    setSequence(newSequence);
  };

  const clearSequence = () => {
    setSequence([]);
    addLog("执行序列已清空。");
  };

  const removeSequenceItem = (index: number) => {
    const newSequence = [...sequence];
    newSequence.splice(index, 1);
    setSequence(newSequence);
    addLog("已从执行序列中移除点位。");
  };

  const startSimulation = () => {
    if (sequence.length === 0) {
      addLog("错误: 请先编排任务序列");
      return;
    }
    setIsSimulating(true);
    setSimProgress(0);
    addLog("开始仿真测试...");
  };

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            setIsSimulating(false);
            addLog("仿真测试完成。");
            return 100;
          }
          return prev + 0.5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const selectedPoint = waypoints.find(p => p.id === selectedPointId);

  return (
    <div className="flex h-screen w-full bg-bg-light overflow-hidden text-text-primary font-sans">
      {/* Left Column: Map Section */}
      <div className="flex-1 min-w-0 border-r border-border-light flex flex-col relative bg-white/50">
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <MapIcon size={18} className="text-primary" />
            <span>地图与点位</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-border-light rounded-lg p-1 shadow-sm">
            <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ZoomIn size={14} /></button>
            <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ZoomOut size={14} /></button>
            <div className="w-px h-4 bg-border-light mx-1" />
            <span className="text-[10px] px-2 text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#f4f4f5]">
          <div 
            className="w-full h-full relative transition-transform duration-200 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Enhanced SLAM Map Background */}
            <div className="relative w-[90%] h-[85%] bg-[#e4e4e7] rounded-[48px] shadow-inner border-[6px] border-white overflow-hidden">
              {/* Floor Texture */}
              <div className="absolute inset-0 bg-[#fdfaf6] opacity-60" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20" />
              
              {/* Internal Walls/Grid */}
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />

              {/* Simulated Complex SLAM Walls */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 500">
                {/* Outer Perimeter */}
                <path d="M50,50 L300,50 L300,120 L500,120 L500,50 L750,50 L750,250 L680,250 L680,450 L400,450 L400,380 L200,380 L200,450 L50,450 Z" fill="none" stroke="#475569" strokeWidth="4" strokeLinejoin="round" />
                
                {/* Internal Rooms & Corridors */}
                <path d="M50,200 L250,200 L250,50" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M250,200 L250,380" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M300,120 L300,280 L500,280 L500,120" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M500,280 L750,280" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M500,350 L680,350" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M400,380 L400,280" fill="none" stroke="#64748b" strokeWidth="2" />
                <path d="M50,320 L150,320 L150,450" fill="none" stroke="#64748b" strokeWidth="2" />
                
                {/* Detail Artifacts (Simulating SLAM noise/details) */}
                <rect x="80" y="80" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <rect x="600" y="100" width="60" height="80" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="120" cy="380" r="15" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <path d="M680,400 L720,400" stroke="#94a3b8" strokeWidth="1" />
              </svg>

              {/* Waypoints Container (Constrained to Map) */}
              <div className="absolute inset-12">
                {/* Route Preview with Flow Animation */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {sequence.length > 1 && sequence.map((pid, i) => {
                    if (i === 0) return null;
                    const p1 = waypoints.find(w => w.id === sequence[i-1]);
                    const p2 = waypoints.find(w => w.id === pid);
                    if (!p1 || !p2) return null;
                    return (
                      <motion.line 
                        key={`route-${i}`}
                        x1={`${p1.x}%`} y1={`${p1.y}%`}
                        x2={`${p2.x}%`} y2={`${p2.y}%`}
                        stroke="#6366f1"
                        strokeWidth="4"
                        strokeDasharray="8 8"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: -16 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="opacity-80"
                      />
                    );
                  })}
                </svg>

                {/* Waypoints */}
                {waypoints.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={false}
                    animate={{
                      scale: selectedPointId === p.id ? 1.2 : 1,
                      zIndex: selectedPointId === p.id ? 30 : 10
                    }}
                    className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${
                      selectedPointId === p.id 
                        ? 'bg-primary text-white shadow-[0_10px_30px_-5px_rgba(99,102,241,0.5)]' 
                        : 'bg-white text-primary border-2 border-primary/20 shadow-sm hover:border-primary/60 hover:shadow-md'
                    }`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    onClick={() => setSelectedPointId(p.id)}
                  >
                    <span className="text-xs font-black tracking-tighter">{p.id}</span>
                    
                    <div className={`absolute top-full mt-3 whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all duration-500 flex items-center gap-1.5 ${
                      selectedPointId === p.id 
                        ? 'bg-primary text-white translate-y-1' 
                        : 'bg-white/80 backdrop-blur-md text-primary border border-primary/10'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${selectedPointId === p.id ? 'bg-white' : 'bg-primary/40'}`} />
                      {p.name}
                    </div>

                    {selectedPointId === p.id && (
                      <motion.div 
                        layoutId="active-ring"
                        className="absolute inset-[-12px] border border-primary/30 rounded-full"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 3,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>
                ))}

                {/* Robot Simulation Indicator (Enhanced) */}
                {isSimulating && sequence.length > 0 && (
                  <motion.div 
                    className="absolute w-10 h-10 -ml-5 -mt-5 bg-white rounded-full z-40 shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center border-2 border-primary"
                    animate={{
                      left: `${waypoints.find(w => w.id === sequence[Math.min(Math.floor((simProgress / 100) * sequence.length), sequence.length - 1)])?.x}%`,
                      top: `${waypoints.find(w => w.id === sequence[Math.min(Math.floor((simProgress / 100) * sequence.length), sequence.length - 1)])?.y}%`,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      left: { duration: 0.1, ease: "linear" },
                      top: { duration: 0.1, ease: "linear" },
                      scale: { repeat: Infinity, duration: 1.5 }
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                    <ChevronRight size={20} className="text-primary rotate-[-90deg] relative z-10" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column: Task Editor Section */}
      <div className="flex-1 min-w-0 border-r border-border-light flex flex-col bg-bg-light">
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <Workflow size={18} className="text-primary" />
            <span>任务编排</span>
            {selectedPoint && (
              <span className="ml-2 text-xs text-slate-400 font-normal">当前点位: {selectedPoint.name}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedPointId && (
            <div className="p-4 bg-white border-b border-border-light flex gap-3 shadow-sm z-10">
              <button 
                onClick={() => addTask(selectedPointId, 'speech')}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                <MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
                讲解
              </button>
              <button 
                onClick={() => addTask(selectedPointId, 'chat')}
                className="flex-1 py-2.5 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                对话
              </button>
              <button 
                onClick={() => addTask(selectedPointId, 'move')}
                className="flex-1 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <Move size={14} className="group-hover:scale-110 transition-transform" />
                移动
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
            {!selectedPointId ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <MapIcon size={32} className="opacity-20" />
                </div>
                <p className="text-sm">请在左侧地图中选择一个点位开始编排</p>
              </div>
            ) : selectedPoint?.tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                <Plus size={32} className="opacity-20" />
                <p className="text-sm">该点位暂无任务，点击上方按钮添加</p>
              </div>
            ) : (
              selectedPoint?.tasks.map((task, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={task.id} 
                  className="bg-white border border-border-light rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500 cursor-grab active:cursor-grabbing">
                        <MoreHorizontal size={14} />
                      </div>
                      <span className="font-bold text-sm text-text-primary">
                        {idx + 1} {
                          task.type === 'speech' ? '固定内容讲解' : 
                          task.type === 'chat' ? '自由对话' :
                          task.type === 'move' ? '移动任务' : 
                          task.type === 'wait' ? '等待任务' : '面向用户'
                        }
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        const newTasks = selectedPoint.tasks.filter(t => t.id !== task.id);
                        updatePoint(selectedPoint.id, { tasks: newTasks });
                      }}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(task.type === 'speech' || task.type === 'chat') && (
                      <>
                        <div className="flex items-center gap-4">
                          <label className="text-xs text-slate-400 w-20">环节描述 *</label>
                          <div className="flex-1 bg-slate-50 border border-border-light rounded-xl px-4 py-2 text-sm text-text-primary flex justify-between items-center">
                            <span>{task.type === 'speech' ? '讲解点位' : '对话点位'}: {selectedPoint.name}</span>
                            <span className="text-[10px] text-slate-400">{selectedPoint.name.length}/200</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <label className="text-xs text-slate-400 w-20 mt-3">{task.type === 'speech' ? '说话内容 *' : '引导语 *'}</label>
                          <div className="flex-1 relative">
                            <textarea 
                              value={task.content}
                              onChange={(e) => {
                                const newTasks = [...selectedPoint.tasks];
                                newTasks[idx].content = e.target.value;
                                updatePoint(selectedPoint.id, { tasks: newTasks });
                              }}
                              className="w-full bg-slate-50 border border-border-light rounded-xl p-4 text-sm text-text-primary min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              {task.type === 'speech' && (
                                <button 
                                  onClick={() => {
                                    const newTasks = [...selectedPoint.tasks];
                                    newTasks[idx].content += ' [动作: 招手]';
                                    updatePoint(selectedPoint.id, { tasks: newTasks });
                                  }}
                                  className="p-2 bg-white border border-border-light rounded-full hover:bg-slate-50 text-slate-500 transition-colors shadow-sm" 
                                  title="插入动作"
                                >
                                  <Accessibility size={14} />
                                </button>
                              )}
                              <button className="p-2 bg-white border border-border-light rounded-full hover:bg-slate-50 text-slate-500 transition-colors shadow-sm" title="插入知识库">
                                <Database size={14} />
                              </button>
                              <span className="text-[10px] text-slate-400 ml-2">{task.content.length}/500</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {task.type === 'move' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="text-xs text-slate-400 w-20">目标点位 *</label>
                          <select 
                            value={task.targetId}
                            onChange={(e) => {
                              const newTasks = [...selectedPoint.tasks];
                              newTasks[idx].targetId = e.target.value;
                              updatePoint(selectedPoint.id, { tasks: newTasks });
                            }}
                            className="flex-1 bg-slate-50 border border-border-light rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          >
                            {waypoints.map(w => (
                              <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="text-xs text-slate-400 w-20">附加动作</label>
                          <div className="flex-1 flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const newTasks = [...selectedPoint.tasks];
                                newTasks[idx].content += ' [动作: 招手]';
                                updatePoint(selectedPoint.id, { tasks: newTasks });
                              }}
                              className="p-2 bg-white border border-border-light rounded-full hover:bg-slate-50 text-slate-500 transition-colors shadow-sm" 
                              title="插入动作"
                            >
                              <Accessibility size={14} />
                            </button>
                            <span className="text-[10px] text-slate-400">{task.content.includes('[动作') ? '已插入动作' : '未插入动作'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {task.type === 'wait' && (
                      <div className="flex items-center gap-4">
                        <label className="text-xs text-slate-400 w-20">等待时长 *</label>
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="number"
                            value={task.duration}
                            onChange={(e) => {
                              const newTasks = [...selectedPoint.tasks];
                              newTasks[idx].duration = parseInt(e.target.value);
                              updatePoint(selectedPoint.id, { tasks: newTasks });
                            }}
                            className="w-20 bg-slate-50 border border-border-light rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="text-xs text-slate-400">秒</span>
                        </div>
                      </div>
                    )}

                    {task.type === 'face' && (
                      <div className="flex items-center gap-4">
                        <label className="text-xs text-slate-400 w-20">面向目标 *</label>
                        <div className="flex-1 bg-slate-50 border border-border-light rounded-xl px-4 py-2 text-sm text-text-primary">
                          面向当前用户
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Debug */}
      <div className="flex-1 min-w-0 border-r border-border-light flex flex-col bg-white">
        <div className="p-4 border-b border-border-light flex items-center justify-between font-semibold text-primary bg-white/80 backdrop-blur-sm relative">
          <div className="flex items-center gap-2">
            <Activity size={18} />
            <span>预览与调试</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsLogsOpen(!isLogsOpen)}
              className={`p-1.5 rounded transition-all ${isLogsOpen ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-400'}`}
              title="查看日志"
            >
              <Terminal size={16} />
            </button>
            <button 
              onClick={() => setIsDebugOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/30">
          {/* Simulation Viewport */}
          <div className="aspect-video bg-slate-100 rounded-2xl border border-border-light relative overflow-hidden flex items-center justify-center group shadow-inner">
             <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/office/400/225')] opacity-10 grayscale" />
             <div className="relative z-10 flex flex-col items-center gap-2">
                {isSimulating ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                    />
                    <span className="text-xs font-medium text-primary">正在执行点位任务...</span>
                  </>
                ) : (
                  <div 
                    onClick={startSimulation}
                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-primary"
                  >
                    <Play size={32} fill="currentColor" />
                  </div>
                )}
             </div>
             {/* Simulation Progress Bar */}
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
               <motion.div 
                 className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                 animate={{ width: `${simProgress}%` }}
               />
             </div>
          </div>

          {/* Task Execution List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">执行序列</label>
              <button onClick={clearSequence} className="text-[10px] text-primary hover:underline font-bold">清空序列</button>
            </div>
            <div className="space-y-2">
              {sequence.map((pid, i) => {
                const p = waypoints.find(w => w.id === pid)!;
                const isActive = Math.floor((simProgress / 100) * sequence.length) === i;
                const isDone = Math.floor((simProgress / 100) * sequence.length) > i;
                
                return (
                  <div key={`${pid}-${i}`} className={`p-4 rounded-2xl border text-xs flex items-center gap-3 transition-all ${isActive ? 'bg-primary/5 border-primary/30 text-primary shadow-sm' : 'bg-white border-border-light text-slate-600 shadow-sm'}`}>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => moveSequenceItem(i, 'up')}
                        disabled={i === 0}
                        className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-20 text-slate-400"
                      >
                        <ChevronUp size={10} />
                      </button>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                      <button 
                        onClick={() => moveSequenceItem(i, 'down')}
                        disabled={i === sequence.length - 1}
                        className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-20 text-slate-400"
                      >
                        <ChevronDown size={10} />
                      </button>
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-bold text-sm">{p.name}</div>
                      <div className="text-[10px] opacity-70 flex gap-1 mt-1">
                        {p.tasks.slice(0, 2).map((t, ti) => (
                          <span key={ti} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            {t.type === 'speech' ? '讲解' : t.type === 'chat' ? '对话' : t.type === 'move' ? '移动' : t.type === 'wait' ? '等待' : '面向'}
                          </span>
                        ))}
                        {p.tasks.length > 2 && <span>...</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => removeSequenceItem(i)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="移除点位"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    ) : null}
                  </div>
                );
              })}
              {sequence.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                  暂无执行任务
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-light bg-white">
          <button className="w-full py-3.5 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
            发布应用
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Far Right Column: Logs (Expandable) */}
      <AnimatePresence>
        {isLogsOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-l border-border-light flex flex-col bg-white overflow-hidden shadow-[-4px_0_20px_rgba(0,0,0,0.02)]"
          >
            <div className="p-4 border-b border-border-light flex items-center justify-between bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Terminal size={18} />
                <span>系统日志</span>
              </div>
              <button 
                onClick={() => setIsLogsOpen(false)} 
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar bg-slate-50/30">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-500 border-l-2 border-slate-200 pl-3 py-1 hover:border-primary/30 transition-colors">
                  <span className="text-slate-300 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-400 italic text-center py-12">等待操作日志...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Modal (Refined Light Theme) */}
      <AnimatePresence>
        {isDebugOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDebugOpen(false)} 
            />
            <motion.div 
              initial={{ x: 600 }}
              animate={{ x: 0 }}
              exit={{ x: 600 }}
              className="relative w-[600px] h-full bg-white border-l border-border-light shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-white">
                <h2 className="text-xl font-bold text-text-primary">调试详情</h2>
                <button 
                  onClick={() => setIsDebugOpen(false)} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/20">
                {/* Metrics Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-border-light shadow-sm">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">耗时</span>
                      <span className="text-xl font-mono text-text-primary font-bold">10716ms</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tokens</span>
                      <span className="text-xl font-mono text-text-primary font-bold">1357</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100">
                      <CheckCircle2 size={12} /> 成功
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">一键反馈</button>
                </div>

                {/* Meta Info */}
                <div className="space-y-2 text-[10px] text-slate-400 font-mono bg-white p-4 rounded-2xl border border-border-light">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Logid :</span> 
                    202603251055502E71B965300CFE0FBEA0 
                    <Save size={12} className="cursor-pointer hover:text-primary ml-1" />
                  </div>
                  <div className="flex items-center gap-8">
                    <span><span className="font-bold text-slate-500">请求发起时间 :</span> 2026-03-25 10:55:50</span>
                    <span><span className="font-bold text-slate-500">首次响应耗时 :</span> 967ms</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-border-light px-2">
                  {['调用树', '火焰图', '积分'].map((tab, i) => (
                    <button key={tab} className={`pb-4 text-sm font-bold border-b-2 transition-all ${i === 0 ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Call Tree Mock */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mt-1 border border-blue-100 shadow-sm"><Move size={16} /></div>
                    <div className="flex-1">
                      <div className="bg-white border border-border-light rounded-2xl p-4 text-xs flex items-center justify-between shadow-sm hover:border-primary/30 transition-colors cursor-pointer">
                        <span className="font-bold text-text-primary">用户输入 UserInput</span>
                        <ChevronDown size={16} className="text-slate-400" />
                      </div>
                      <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-100 pl-8 relative">
                        <div className="absolute left-0 top-4 w-6 h-0.5 bg-slate-100" />
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border-light shadow-sm">
                          <div className="w-6 h-6 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center border border-orange-100"><MessageSquare size={14} /></div>
                          <span className="text-[11px] font-bold text-slate-600">调用 LLM 豆包·1.8·深度思考</span>
                        </div>
                        <div className="absolute left-0 top-16 w-6 h-0.5 bg-slate-100" />
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border-light shadow-sm">
                          <div className="w-6 h-6 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center border border-orange-100"><MessageSquare size={14} /></div>
                          <span className="text-[11px] font-bold text-slate-600">调用 LLM Seed Suggest</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node Details */}
                <div className="space-y-4 bg-white p-6 rounded-3xl border border-border-light shadow-sm">
                  <h3 className="text-sm font-bold text-text-primary">节点详情</h3>
                  <div className="grid grid-cols-2 gap-6 text-xs">
                    <div className="flex items-center gap-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">类型</span> <span className="text-text-primary font-medium">开始</span></div>
                    <div className="flex items-center gap-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">状态</span> <span className="text-green-600 font-bold">成功</span></div>
                    <div className="flex items-center gap-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">名称</span> <span className="text-text-primary font-medium">UserInput</span></div>
                    <div className="flex items-center gap-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">整体耗时</span> <span className="text-text-primary font-medium">10716ms</span></div>
                  </div>
                </div>

                {/* Input/Output JSON Mock */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-text-primary">输入</h3>
                    <Save size={16} className="text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[11px] text-slate-300 leading-relaxed shadow-xl">
                    <pre className="overflow-x-auto">{`[
  {
    "content_type": "text",
    "content": {
      "text": "你是被谁创造出来的？",
      "image_url": "",
      "file_url": ""
    }
  }
]`}</pre>
                  </div>
                </div>

                <div className="space-y-4 pb-12">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-text-primary">输出</h3>
                    <Save size={16} className="text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[11px] text-slate-300 leading-relaxed shadow-xl">
                    <p className="whitespace-pre-wrap">（眼睛亮晶晶地晃了晃脑袋）哈哈，我是被字节跳动的超厉害技术团队创造出来的哦！他们一群技术大牛攒了好多智慧和心血，才把我带到你面前哒😜</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
