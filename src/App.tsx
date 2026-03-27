import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Network,
  Play, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  Trash2, 
  MessageSquare, 
  Move, 
  Activity,
  ChevronDown,
  ChevronUp,
  Terminal,
  Save,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Search,
  Cpu,
  Workflow,
  X,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  FileText,
  CheckCircle2,
  MapPin,
  Database,
  Wrench,
  Zap,
  AtSign,
  Send,
  Edit3,
  History
} from 'lucide-react';
import { Waypoint, Task, INITIAL_PROMPT } from './types.ts';

// Initial 10 waypoints based on Museum Tour scenario
const INITIAL_WAYPOINTS: Waypoint[] = [
  { id: '1', x: 15, y: 25, name: '博物馆前台', tasks: [] },
  { id: '2', x: 25, y: 15, name: '入口闸机', tasks: [] },
  { id: '3', x: 45, y: 20, name: '古埃及馆', tasks: [] },
  { id: '4', x: 75, y: 15, name: '古希腊馆', tasks: [] },
  { id: '5', x: 85, y: 45, name: '雕塑艺术区', tasks: [] },
  { id: '6', x: 65, y: 75, name: '古典油画区', tasks: [] },
  { id: '7', x: 40, y: 85, name: '梵高特展馆', tasks: [] },
  { id: '8', x: 15, y: 70, name: '现代艺术厅', tasks: [] },
  { id: '9', x: 50, y: 50, name: '中庭休息区', tasks: [] },
  { id: '10', x: 85, y: 85, name: '出口 A', tasks: [] },
];

const TASK_TYPES = [
  { id: 'speech', name: '讲解', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20', placeholder: '输入讲解词，例如：欢迎来到梵高特展馆...' },
  { id: 'chat', name: '对话', icon: Sparkles, color: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20', placeholder: '输入对话引导语，例如：您可以问我关于星空的问题...' },
  { id: 'move', name: '移动', icon: Move, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20', placeholder: '输入移动目标或描述...' },
  { id: 'action', name: '动作', icon: Activity, color: 'text-secondary', bg: 'bg-secondary/5', border: 'border-secondary/20', placeholder: '选择一个动作...' },
  { id: 'knowledge', name: '知识库', icon: Database, color: 'text-success', bg: 'bg-success/5', border: 'border-success/20', placeholder: '输入知识库查询关键词...' },
  { id: 'tool', name: '工具', icon: Wrench, color: 'text-text-secondary', bg: 'bg-slate-50', border: 'border-border-light', placeholder: '输入工具指令...' },
  { id: 'skill', name: '技能', icon: Zap, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20', placeholder: '输入技能名称或参数...' },
];

const ACTION_LIBRARY = [
  { id: '1', name: '餐厅服务员递送', price: 'Free', image: 'https://picsum.photos/seed/robot1/400/500', isOfficial: false },
  { id: '2', name: '紧急避障动作', price: 'Free', image: 'https://picsum.photos/seed/robot2/400/500', isOfficial: false },
  { id: '3', name: '空姐单手指引动作', price: 'Free', image: 'https://picsum.photos/seed/robot3/400/500', isOfficial: false },
  { id: '4', name: '熊明茂上架的动作', price: 'Free', image: 'https://picsum.photos/seed/robot4/400/500', isOfficial: true },
  { id: '5', name: '简单舞蹈动作', price: 'Free', image: 'https://picsum.photos/seed/robot5/400/500', isOfficial: true },
];

import { PERSONA_TEMPLATES } from './types.ts';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'config' | 'main'>('config');
  const [appInfo, setAppInfo] = useState({ name: '博物馆智能导览系统', description: '为游客提供深度的文物讲解与导引服务' });
  const [personaPrompt, setPersonaPrompt] = useState(PERSONA_TEMPLATES.tour.prompt);
  const [collapsedModules, setCollapsedModules] = useState({ map: false, tasks: false, preview: false });
  
  const [waypoints, setWaypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>('tour');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [isTaskEditorHighlighted, setIsTaskEditorHighlighted] = useState(false);
  const [orchestrationParts, setOrchestrationParts] = useState<{ type: 'text' | 'tag', tagType?: 'task' | 'action', id?: string, name?: string, content?: string, color?: string, bg?: string, border?: string, icon?: any }[]>([]);
  const [conversationalInput, setConversationalInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showActionShowcase, setShowActionShowcase] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger highlight when selectedPointId changes
  useEffect(() => {
    if (selectedPointId) {
      setIsTaskEditorHighlighted(true);
      const timer = setTimeout(() => setIsTaskEditorHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedPointId]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const updatePoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addTask = (pointId: string, type: Task['type'], customContent?: string, actionId?: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: customContent || (type === 'speech' ? '您好，欢迎光临！' : 
               type === 'chat' ? '进入自由对话模式' :
               type === 'move' ? '移动到指定点位' :
               type === 'wait' ? '等待 3 秒' : 
               type === 'knowledge' ? '检索知识库内容' :
               type === 'tool' ? '执行外部工具' :
               type === 'skill' ? '调用专业技能' : 
               type === 'action' ? '执行预设动作' : '面向用户'),
      actionType: 'none',
      targetId: type === 'move' ? '1' : undefined,
      duration: type === 'wait' ? 3 : undefined,
      actionId
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

  const handleAddTask = () => {
    if (selectedPointId && (conversationalInput.trim() || orchestrationParts.length > 0)) {
      // Consolidate all parts into a single task content
      let finalContent = '';
      let primaryType: Task['type'] = 'speech';
      let actionId: string | undefined = undefined;

      // Add existing parts
      orchestrationParts.forEach(part => {
        if (part.type === 'text') {
          finalContent += part.content;
        } else if (part.type === 'tag') {
          if (part.tagType === 'action') {
            finalContent += ` [执行动作: ${part.name}]`;
            actionId = part.id;
          } else {
            // Use the first task tag as the primary type
            if (primaryType === 'speech') primaryType = part.id as any;
          }
        }
      });

      // Add current input
      if (conversationalInput.trim()) {
        finalContent += (finalContent ? ' ' : '') + conversationalInput.trim();
      }

      addTask(selectedPointId, primaryType, finalContent, actionId);
      setConversationalInput('');
      setOrchestrationParts([]);
    }
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

  if (currentPage === 'config') {
    return (
      <div className="min-h-screen w-full bg-bg-light overflow-y-auto font-sans selection:bg-primary/10 relative">
        {/* Background Decoration */}
        <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary z-50" />
        
        {/* Atmospheric Blobs */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />

        <div className="flex flex-col max-w-4xl mx-auto w-full p-6 lg:p-10 gap-8 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between shrink-0"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
                IRON <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">机器人应用编排</span>
              </h1>
              <p className="text-text-secondary text-sm font-medium mt-2">定义机器人的核心灵魂与应用边界，构建下一代智能交互体验</p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-8 flex-1 min-h-0">
            {/* Section 1: Basic Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-border-light shadow-soft hover:shadow-hover transition-all duration-300 space-y-6 shrink-0"
            >
              <div className="flex items-center gap-3 text-text-primary font-bold text-lg">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
                <span>基础信息</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">应用名称</label>
                  <input 
                    type="text" 
                    value={appInfo.name}
                    onChange={(e) => setAppInfo({...appInfo, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:text-slate-300"
                    placeholder="例如：大英博物馆智能向导"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">应用描述</label>
                  <input 
                    type="text" 
                    value={appInfo.description}
                    onChange={(e) => setAppInfo({...appInfo, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:text-slate-300"
                    placeholder="简述该机器人的服务宗旨..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Section 2: Persona & Logic */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[32px] border border-border-light shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden flex flex-col flex-1 min-h-0"
            >
              <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3 text-text-primary font-bold text-lg">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Terminal size={20} />
                  </div>
                  <span>人设定义</span>
                </div>
                
                {/* Template Tabs */}
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {Object.entries(PERSONA_TEMPLATES).map(([key, template]) => (
                    <button 
                      key={key}
                      onClick={() => {
                        setPersonaPrompt(template.prompt);
                        setActiveTemplate(key);
                      }}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTemplate === key 
                          ? 'bg-white text-primary shadow-soft' 
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {template.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-8 pt-2 pb-8 flex flex-col flex-1 min-h-0 space-y-6">
                <div className="relative group flex-1 min-h-[500px]">
                  <textarea 
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    className="relative z-10 w-full h-full min-h-[500px] bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-sm font-medium leading-relaxed focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none placeholder:text-slate-300 font-mono custom-scrollbar"
                    placeholder="在此输入机器人的详细人设 Prompt..."
                  />
                </div>

                <div className="flex items-center justify-between shrink-0">
                  <div className="text-xs text-text-secondary font-bold font-mono bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    {personaPrompt.length} CHARACTERS
                  </div>
                  <button 
                    onClick={() => setCurrentPage('main')}
                    className="px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold text-base flex items-center justify-center gap-3 shadow-button hover:shadow-hover hover:-translate-y-1 active:translate-y-0 transition-all group"
                  >
                    开始编排任务
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-bg-light overflow-hidden text-text-primary font-sans">
      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-border-light flex items-center justify-between px-6 z-50 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentPage('config')}
            className="p-2 hover:bg-slate-50 rounded-full text-text-secondary transition-colors border border-transparent hover:border-border-light"
            title="返回配置"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] shadow-soft">
              <div className="w-full h-full rounded-[11px] bg-white flex items-center justify-center overflow-hidden">
                <img 
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Denglu&backgroundColor=b6e3f4" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-text-primary tracking-tight text-lg">DENGLU</span>
              <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors">
                <Edit3 size={14} />
              </button>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-border-light mx-2" />
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-xs text-text-secondary font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>已自动保存 {new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span>
            </div>
            <div className="h-5 w-[1px] bg-border-light mx-1" />
            <button className="p-2 hover:bg-slate-50 rounded-full text-text-secondary transition-colors">
              <History size={20} />
            </button>
          </div>
          <button className="px-8 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold text-sm transition-all shadow-button hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0">
            发布应用
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Map Section */}
      <div className={`flex flex-col relative bg-white border-r border-border-light transition-all duration-500 ease-in-out ${collapsedModules.map ? 'w-16' : 'flex-1 min-w-0'}`}>
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-white h-16 shadow-sm z-10">
          {!collapsedModules.map ? (
            <>
              <div className="flex items-center gap-3 font-bold text-text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapIcon size={18} />
                </div>
                <span>地图与点位</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-50 border border-border-light rounded-xl p-1 shadow-inner">
                  <button onClick={() => setZoom(Math.min(zoom + 0.1, 2))} className="p-1.5 hover:bg-white hover:shadow-soft rounded-lg text-text-secondary transition-all"><ZoomIn size={14} /></button>
                  <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} className="p-1.5 hover:bg-white hover:shadow-soft rounded-lg text-text-secondary transition-all"><ZoomOut size={14} /></button>
                </div>
                <button 
                  onClick={() => setCollapsedModules(prev => ({ ...prev, map: true }))}
                  className="p-2 hover:bg-slate-50 rounded-xl text-text-secondary transition-colors"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setCollapsedModules(prev => ({ ...prev, map: false }))}
              className="w-full h-full flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Maximize2 size={24} />
            </button>
          )}
        </div>

        {!collapsedModules.map && (
          <div className="flex-1 relative overflow-hidden bg-[#f4f4f5]">
            <div 
              className="w-full h-full relative transition-transform duration-200 ease-out flex items-center justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* Enhanced SLAM Map Background */}
              <div className="relative w-[92%] h-[88%] bg-[#e2e8f0] rounded-[64px] shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)] border-[8px] border-white overflow-hidden">
                {/* Floor Texture */}
                <div className="absolute inset-0 bg-[#f8fafc] opacity-80" />
                
                {/* Internal Walls/Grid */}
                <div className="absolute inset-0" style={{ 
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />

                {/* Simulated Complex SLAM Walls */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 500">
                  {/* Outer Perimeter */}
                  <path d="M40,40 L320,40 L320,100 L480,100 L480,40 L760,40 L760,260 L700,260 L700,460 L420,460 L420,400 L180,400 L180,460 L40,460 Z" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinejoin="round" />
                  
                  {/* Internal Rooms & Corridors */}
                  <path d="M40,180 L280,180 L280,40" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M280,180 L280,400" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M320,100 L320,300 L480,300 L480,100" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M480,300 L760,300" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M480,380 L700,380" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M420,400 L420,300" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M40,300 L160,300 L160,460" fill="none" stroke="#334155" strokeWidth="3" />
                  
                  {/* Structural Columns */}
                  <rect x="120" y="100" width="12" height="12" fill="#94a3b8" />
                  <rect x="120" y="240" width="12" height="12" fill="#94a3b8" />
                  <rect x="600" y="120" width="12" height="12" fill="#94a3b8" />
                  <rect x="600" y="240" width="12" height="12" fill="#94a3b8" />
                  <rect x="380" y="200" width="12" height="12" fill="#94a3b8" />
                </svg>

                {/* Waypoints Container */}
                <div className="absolute inset-12">
                  {/* Route Preview */}
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
                          ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-button scale-110' 
                          : 'bg-white text-primary border border-border-light shadow-soft hover:border-primary/40 hover:shadow-hover'
                      }`}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      onClick={() => setSelectedPointId(p.id)}
                    >
                      <MapPin size={selectedPointId === p.id ? 20 : 16} strokeWidth={selectedPointId === p.id ? 2.5 : 2} />
                      
                      <div className={`absolute top-full mt-0.5 whitespace-nowrap px-4 py-2 rounded-2xl text-[11px] font-bold shadow-hover transition-all duration-500 flex flex-col items-center gap-1.5 border ${
                        selectedPointId === p.id 
                          ? 'bg-white text-text-primary border-primary/20' 
                          : 'bg-white/95 backdrop-blur-md text-text-secondary border-border-light'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedPointId === p.id ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                          {p.name}
                        </div>
                        {p.tasks.length > 0 && (
                          <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${selectedPointId === p.id ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-text-secondary'}`}>
                            <Activity size={10} />
                            {p.tasks[0].content.substring(0, 12)}
                          </div>
                        )}
                      </div>

                      {selectedPointId === p.id && (
                        <motion.div 
                          layoutId="active-ring"
                          className="absolute inset-[-12px] border border-primary/30 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />
                      )}
                    </motion.div>
                  ))}

                  {/* Robot Simulation Indicator */}
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
        )}
      </div>

      {/* Middle Column: Task Editor Section */}
      <div className={`flex flex-col bg-bg-light border-r border-border-light transition-all duration-500 ease-in-out relative ${collapsedModules.tasks ? 'w-16' : 'flex-1 min-w-0'}`}>
        {/* Visual Linkage Highlight */}
        <AnimatePresence>
          {isTaskEditorHighlighted && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 border-2 border-primary/30 pointer-events-none z-50 rounded-none shadow-[inset_0_0_60px_rgba(79,70,229,0.05)]"
            />
          )}
        </AnimatePresence>

        <div className="p-4 border-b border-border-light flex items-center justify-between bg-white h-16 shrink-0 shadow-sm z-10">
          {!collapsedModules.tasks ? (
            <>
              <div className="flex items-center gap-3 text-base font-bold text-text-primary">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <Workflow size={18} />
                </div>
                <span>任务编排</span>
              </div>
              <button 
                onClick={() => setCollapsedModules(prev => ({ ...prev, tasks: true }))}
                className="p-2 hover:bg-slate-50 rounded-xl text-text-secondary transition-colors"
              >
                <Minimize2 size={18} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setCollapsedModules(prev => ({ ...prev, tasks: false }))}
              className="w-full h-full flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Maximize2 size={24} />
            </button>
          )}
        </div>

        {!collapsedModules.tasks && (
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Point Header - Minimal Style */}
            {selectedPoint && (
              <div className="px-5 py-3 bg-white border-b border-border-light flex items-center gap-3 shadow-sm">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm"
                >
                  <MapPin size={16} strokeWidth={2.5} />
                </motion.div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-text-primary tracking-tight leading-none">{selectedPoint.name}</h2>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-0.5">点位任务编排中心</p>
                </div>
                
                {selectedPoint.tasks.length === 0 && (
                  <div className="ml-auto px-2 py-0.5 bg-bg-light rounded-full border border-border-light text-[9px] text-text-secondary font-medium">
                    待编排
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
              {!selectedPointId ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-4">
                  <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center">
                    <MapIcon size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm">请在左侧地图中选择一个点位开始编排</p>
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
                        <div className="w-6 h-6 bg-bg-light rounded flex items-center justify-center text-xs font-bold text-text-secondary cursor-grab active:cursor-grabbing">
                          <MoreHorizontal size={14} />
                        </div>
                        <span className="font-bold text-sm text-text-primary">
                          {idx + 1} {
                            task.type === 'speech' ? '讲解任务' : 
                            task.type === 'chat' ? '对话任务' :
                            task.type === 'move' ? '移动任务' : 
                            task.type === 'wait' ? '等待任务' : 
                            task.type === 'knowledge' ? '知识库检索' :
                            task.type === 'tool' ? '工具调用' :
                            task.type === 'skill' ? '技能执行' : '面向用户'
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
                      <div className="flex items-start gap-4">
                        <label className="text-xs text-text-secondary w-20 mt-3">任务内容 *</label>
                        <div className="flex-1 relative">
                          <textarea 
                            value={task.content}
                            onChange={(e) => {
                              const newTasks = [...selectedPoint.tasks];
                              newTasks[idx].content = e.target.value;
                              updatePoint(selectedPoint.id, { tasks: newTasks });
                            }}
                            className="w-full bg-bg-light border border-border-light rounded-xl p-4 text-sm text-text-primary min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            placeholder="输入任务具体内容..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Conversational Orchestration Input */}
            {selectedPointId && (
              <div className="p-4 bg-white border-t border-border-light relative space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    {/* Task Type Quick Selection - Flattened */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {TASK_TYPES.map(type => (
                        <button 
                          key={type.id}
                          onClick={() => {
                            // Commit current text if any
                            if (conversationalInput.trim()) {
                              setOrchestrationParts(prev => [...prev, { type: 'text', content: conversationalInput.trim() }]);
                              setConversationalInput('');
                            }
                            
                            // Add the tag
                            setOrchestrationParts(prev => [...prev, { 
                              type: 'tag',
                              tagType: 'task',
                              id: type.id, 
                              name: type.name, 
                              color: type.color, 
                              bg: type.bg, 
                              border: type.border,
                              icon: type.icon 
                            }]);
                            
                            if (type.id === 'action') setShowActionShowcase(true);
                            inputRef.current?.focus();
                          }}
                          className={`flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all border ${
                            orchestrationParts.some(p => p.type === 'tag' && p.id === type.id)
                              ? `${type.bg} ${type.color} ${type.border} shadow-sm` 
                              : 'bg-bg-light text-text-secondary border-transparent hover:bg-slate-100'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <div 
                        onClick={() => inputRef.current?.focus()}
                        className={`flex flex-wrap items-center gap-3 w-full bg-slate-50 border rounded-3xl p-3 pr-14 transition-all cursor-text min-h-[60px] relative ${
                          isInputFocused ? 'ring-4 ring-primary/10 border-primary bg-white shadow-lg' : 'border-border-light'
                        }`}
                      >
                        {orchestrationParts.map((part, index) => (
                          part.type === 'tag' ? (
                            <div 
                              key={`tag-${index}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border animate-in fade-in zoom-in duration-200 shadow-soft transition-all hover:shadow-hover ${
                                part.tagType === 'task' 
                                  ? 'bg-primary/5 text-primary border-primary/20' 
                                  : 'bg-secondary/5 text-secondary border-secondary/20'
                              }`}
                            >
                              <span>{part.tagType === 'task' ? '' : '动作: '}{part.name}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrchestrationParts(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="hover:bg-primary/10 p-0.5 rounded-full transition-colors ml-1"
                              >
                                <X size={16} className="stroke-[3px]" />
                              </button>
                            </div>
                          ) : (
                            <span key={`text-${index}`} className="text-text-primary text-base font-medium bg-slate-100/50 px-2 py-1 rounded-lg">{part.content}</span>
                          )
                        ))}

                        <div className="flex-1 min-w-[120px] relative">
                          <input 
                            ref={inputRef}
                            type="text"
                            value={conversationalInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConversationalInput(val);
                              
                              const lastChar = val[val.length - 1];
                              if (lastChar === '@') {
                                setShowMentionMenu(true);
                                setMentionFilter('');
                              } else if (showMentionMenu) {
                                const parts = val.split('@');
                                setMentionFilter(parts[parts.length - 1]);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (conversationalInput.trim() || orchestrationParts.length > 0)) {
                                handleAddTask();
                              }
                              if (e.key === 'Backspace' && !conversationalInput && orchestrationParts.length > 0) {
                                setOrchestrationParts(prev => prev.slice(0, -1));
                              }
                            }}
                            placeholder={
                              orchestrationParts.length === 0 
                                ? "对话式编排，输入 @ 呼出功能模块..." 
                                : orchestrationParts[orchestrationParts.length - 1].type === 'tag'
                                  ? orchestrationParts[orchestrationParts.length - 1].id === 'speech' 
                                    ? "请输入讲解内容..." 
                                    : orchestrationParts[orchestrationParts.length - 1].id === 'action'
                                      ? "请在橱窗中选择动作..."
                                      : `继续输入内容...`
                                  : "继续输入内容..."
                            }
                            className="w-full bg-transparent border-none focus:outline-none text-base py-1 placeholder:text-text-secondary/40"
                          />
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTask();
                          }}
                          className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-button transition-all hover:scale-105 active:scale-95 z-10"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>

                {/* Action Showcase Modal */}
                <AnimatePresence>
                  {showActionShowcase && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                      onClick={() => setShowActionShowcase(false)}
                    >
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-8 border-b border-border-light flex items-center justify-between bg-bg-light">
                          <div>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight">动作橱窗</h3>
                            <p className="text-sm text-text-secondary font-medium">选择一个预设动作添加到任务序列</p>
                          </div>
                          <button 
                            onClick={() => setShowActionShowcase(false)}
                            className="p-3 hover:bg-slate-200 rounded-full text-text-secondary transition-all"
                          >
                            <X size={24} />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {ACTION_LIBRARY.map(action => (
                              <motion.div 
                                key={action.id}
                                whileHover={{ y: -8 }}
                                className="group cursor-pointer"
                                onClick={() => {
                                  setOrchestrationParts(prev => {
                                    // Replace the generic 'action' task tag if it's the last tag
                                    const lastTagIndex = [...prev].reverse().findIndex(p => p.type === 'tag' && p.id === 'action');
                                    if (lastTagIndex !== -1) {
                                      const actualIndex = prev.length - 1 - lastTagIndex;
                                      const newParts = [...prev];
                                      newParts[actualIndex] = { 
                                        type: 'tag', 
                                        tagType: 'action',
                                        id: action.id, 
                                        name: action.name 
                                      };
                                      return newParts;
                                    }
                                    return [...prev, { 
                                      type: 'tag', 
                                      tagType: 'action',
                                      id: action.id, 
                                      name: action.name 
                                    }];
                                  });
                                  setShowActionShowcase(false);
                                  inputRef.current?.focus();
                                }}
                              >
                                <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 relative mb-4 border border-border-light group-hover:border-primary/30 transition-all shadow-soft group-hover:shadow-hover">
                                  <img 
                                    src={action.image} 
                                    alt={action.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                  />
                                  {action.isOfficial && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-success/10 text-success text-[10px] font-black rounded-lg flex items-center gap-1 border border-success/20 backdrop-blur-sm">
                                      <AtSign size={10} />
                                      官方
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-text-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <button className="w-full py-2 bg-white text-text-primary rounded-xl text-xs font-bold shadow-button">
                                      选择动作
                                    </button>
                                  </div>
                                </div>
                                <h4 className="font-bold text-text-primary text-sm mb-1 group-hover:text-primary transition-colors">{action.name}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-success font-black text-sm">{action.price}</span>
                                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">购买</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mention Menu */}
                <AnimatePresence>
                  {showMentionMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-4 right-4 mb-4 bg-white border border-border-light rounded-[24px] shadow-hover overflow-hidden z-50"
                    >
                      <div className="p-3 bg-bg-light border-b border-border-light flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-2">选择功能模块</span>
                        <button onClick={() => setShowMentionMenu(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-text-secondary"><X size={14} /></button>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                        {TASK_TYPES.filter(item => item.name.includes(mentionFilter)).map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              const textBeforeMention = conversationalInput.replace(/@\w*$/, '').trim();
                              
                              setOrchestrationParts(prev => {
                                const newParts = [...prev];
                                if (textBeforeMention) {
                                  newParts.push({ type: 'text', content: textBeforeMention });
                                }
                                newParts.push({ 
                                  type: 'tag', 
                                  tagType: 'task',
                                  id: item.id, 
                                  name: item.name, 
                                  color: item.color, 
                                  bg: item.bg, 
                                  border: item.border,
                                  icon: item.icon 
                                });
                                return newParts;
                              });
                              
                              setConversationalInput('');
                              setShowMentionMenu(false);
                              if (item.id === 'action') setShowActionShowcase(true);
                              inputRef.current?.focus();
                            }}
                            className="flex items-center gap-4 p-4 hover:bg-bg-light rounded-2xl transition-all text-left group"
                          >
                            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft`}>
                              <item.icon size={20} />
                            </div>
                            <span className="text-sm font-bold text-text-primary">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Preview & Debug */}
      <div className={`flex flex-col bg-white transition-all duration-500 ease-in-out ${collapsedModules.preview ? 'w-16' : 'flex-1 min-w-0'}`}>
        <div className="p-4 border-b border-border-light flex items-center justify-between bg-white h-16 shrink-0 shadow-sm z-10">
          {!collapsedModules.preview ? (
            <>
              <div className="flex items-center gap-3 text-base font-bold text-text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={18} />
                </div>
                <span>预览与调试</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsLogsOpen(!isLogsOpen)}
                  className={`p-2 rounded-xl transition-all ${isLogsOpen ? 'bg-primary/10 text-primary shadow-soft' : 'hover:bg-bg-light text-text-secondary'}`}
                  title="查看日志"
                >
                  <Terminal size={18} />
                </button>
                <button 
                  onClick={() => setCollapsedModules(prev => ({ ...prev, preview: true }))}
                  className="p-2 hover:bg-bg-light rounded-xl text-text-secondary transition-colors"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setCollapsedModules(prev => ({ ...prev, preview: false }))}
              className="w-full h-full flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
            >
              <Maximize2 size={24} />
            </button>
          )}
        </div>

        {!collapsedModules.preview && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-bg-light/30">
            {/* Simulation Viewport */}
            <div className="aspect-video bg-slate-100 rounded-[32px] border border-border-light relative overflow-hidden flex items-center justify-center group shadow-soft">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-text-primary/60 via-transparent to-transparent" />
               
               {isSimulating ? (
                 <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-white/30 animate-pulse shadow-glow">
                     <Cpu size={40} className="text-white" />
                   </div>
                   <div className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold tracking-widest uppercase">
                     正在执行仿真巡检...
                   </div>
                 </div>
               ) : (
                 <button 
                   onClick={startSimulation}
                   className="relative z-10 w-20 h-20 bg-white rounded-full shadow-button flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all group/btn"
                 >
                   <Play size={32} fill="currentColor" className="ml-1 group-hover/btn:scale-110 transition-transform" />
                 </button>
               )}

               <div className="absolute bottom-6 left-6 right-6 z-10">
                 <div className="flex items-center justify-between text-[10px] text-white/80 font-bold mb-2 uppercase tracking-wider">
                   <span>博物馆实景仿真</span>
                   <span>{isSimulating ? `${Math.round(simProgress)}%` : '待机中'}</span>
                 </div>
                 <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                   <motion.div 
                     className="h-full bg-gradient-to-r from-primary to-secondary"
                     initial={{ width: 0 }}
                     animate={{ width: `${simProgress}%` }}
                   />
                 </div>
               </div>
            </div>

            {/* Task Execution List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-base font-bold text-text-primary">
                  <Activity size={18} className="text-text-secondary" />
                  <span>执行序列</span>
                </div>
                <button onClick={clearSequence} className="text-xs text-primary hover:underline font-bold">清空序列</button>
              </div>
              <div className="space-y-3">
                {sequence.map((pid, i) => {
                  const p = waypoints.find(w => w.id === pid);
                  if (!p) return null;
                  const isActive = Math.floor((simProgress / 100) * sequence.length) === i;
                  const isDone = Math.floor((simProgress / 100) * sequence.length) > i;
                  
                  return (
                    <div key={`${pid}-${i}`} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isActive ? 'bg-primary/5 border-primary/30 text-primary shadow-soft' : 'bg-white border-border-light text-text-secondary shadow-sm'}`}>
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => moveSequenceItem(i, 'up')}
                          disabled={i === 0}
                          className="p-1 hover:bg-bg-light rounded-lg disabled:opacity-20 text-text-secondary"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-primary text-white shadow-button' : 'bg-bg-light text-text-secondary'}`}>{i + 1}</span>
                        <button 
                          onClick={() => moveSequenceItem(i, 'down')}
                          disabled={i === sequence.length - 1}
                          className="p-1 hover:bg-bg-light rounded-lg disabled:opacity-20 text-text-secondary"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-black text-sm text-text-primary tracking-tight">{p.name}</div>
                        <div className="text-[10px] font-bold opacity-60 flex gap-2 mt-1">
                          {p.tasks.slice(0, 2).map((t, ti) => (
                            <span key={ti} className="bg-bg-light px-2 py-0.5 rounded-lg text-text-secondary uppercase tracking-tighter border border-border-light">
                              {t.type === 'speech' ? '讲解' : t.type === 'chat' ? '对话' : t.type === 'move' ? '移动' : t.type === 'wait' ? '等待' : '面向'}
                            </span>
                          ))}
                          {p.tasks.length > 2 && <span>...</span>}
                        </div>
                      </div>
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center shadow-soft">
                          <CheckCircle2 size={16} />
                        </div>
                      ) : isActive ? (
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping shadow-glow" />
                      ) : null}
                    </div>
                  );
                })}
                {sequence.length === 0 && (
                  <div className="text-center py-16 text-text-secondary text-sm italic border-2 border-dashed border-border-light rounded-3xl bg-white/50">
                    暂无执行任务
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Far Right Column: Logs (Expandable) */}
      <AnimatePresence>
        {isLogsOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-l border-border-light flex flex-col bg-white overflow-hidden shadow-hover"
          >
            <div className="p-4 border-b border-border-light flex items-center justify-between bg-bg-light/50 backdrop-blur-sm h-16 shrink-0">
              <div className="flex items-center gap-3 font-bold text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Terminal size={18} />
                </div>
                <span>系统日志</span>
              </div>
              <button 
                onClick={() => setIsLogsOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-xl text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto font-mono text-[11px] space-y-4 custom-scrollbar bg-bg-light/30">
              {logs.map((log, i) => (
                <div key={i} className="text-text-secondary border-l-2 border-primary/20 pl-4 py-1.5 hover:border-primary/50 transition-colors bg-white/40 rounded-r-lg">
                  <span className="text-primary/40 mr-2 font-bold">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-text-secondary italic text-center py-20 opacity-40">等待操作日志...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Modal (Removed as per cleanup, but keeping structure if needed later) */}

      </div>
    </div>
  );
}
