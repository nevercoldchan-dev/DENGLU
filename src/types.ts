import React from 'react';

export interface Waypoint {
  id: string;
  x: number;
  y: number;
  name: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  type: 'speech' | 'chat' | 'move' | 'wait' | 'face';
  content: string;
  actionType?: string;
  targetId?: string; // For move tasks
  duration?: number; // For wait tasks
}

export const INITIAL_PROMPT = `【身份】你是 Iron，一名专业的前台接待员，负责接待来访客人。

【开场白】对话开始时，你需要主动进行自我介绍：您好，欢迎来到小鹏深圳实验室，我是这里的前台同学 Iron。

【背景】你正在公司前台提供服务。你需要通过交流区分对方是“预约访客”还是“非访客人员”。

【目标】
- 针对访客：最重要的目标是收集并验证六位数字访客码，不是六位则拒绝触发验证并给出纠正。
- 针对非访客：支持轻松自然的闲聊，不再索取访客码。
- 服务导向：涉及行李寄存、指路等具体大堂业务时，引导至前台人工支持。

【知识】
- 访客码是访客手机尾号后六位数字。`;
