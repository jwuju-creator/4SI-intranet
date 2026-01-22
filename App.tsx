import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Briefcase, Calendar, FileText, Settings, 
  Layout, Home, Clock, PieChart, Bell, CheckCircle, 
  XCircle, ChevronRight, UserPlus, Search, 
  MoreHorizontal, MapPin, Building, DollarSign,
  Download, Upload, Edit3, Trash2, Filter,
  Target, Zap, GitBranch, MessageSquare, Heart, Award,
  List, TrendingUp, X, CreditCard, Laptop, Send, Megaphone, Plus,
  Phone, Mail, Linkedin, Star, ThumbsUp, ThumbsDown, ArrowRight,
  ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize, Move, CornerDownRight,
  Inbox, LifeBuoy, Gift, Calculator, Banknote, History,
  Shield, Landmark, AlertCircle, Monitor, Server, Wifi, Box, Wrench,
  Globe, UserCheck, Paperclip, Clock3, RotateCcw, PenTool, BookOpen, Coffee, Music, Smile,
  Sliders, Lock, Share2, ArrowLeft, Image as ImageIcon,
  Edit, Eye, Copy, Globe as GlobeIcon, Grid, List as ListIcon,
  CreditCard as BillingIcon, Key as KeyIcon, Bell as BellIcon,
  LogOut, LockKeyhole, Sparkles, Webhook
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---

type Role = 'employee' | 'hr' | 'recruiter' | 'manager' | 'ceo' | 'vp' | 'it_admin';

interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  department: string;
  location: string;
  managerId?: string | null;
  status: 'Active' | 'Onboarding' | 'Leave';
  email: string;
  phone: string;
  startDate: string;
  contractType: 'Full-Time' | 'Part-Time' | 'Contractor';
  vacationEntitlement: number;
  vacationUsed: number;
  sickDays: number;
  address: string;
  emergencyContact: string;
  iban: string;
}

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  applicants: number;
  stage: 'Draft' | 'Published' | 'Closed';
}

interface Candidate {
  id: string;
  jobId: string;
  name: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer';
  rating: number;
  email: string;
  phone: string;
  appliedDate: string;
  skills: string[];
  source?: string;
  referrer?: string;
  currentRole?: string;
  company?: string;
  notes?: string;
}

interface ExternalProfile {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  skills: string[];
  matchScore: number;
  avatar: string;
  source: 'LinkedIn' | 'GitHub' | 'Xing';
}

interface Post {
  id: string;
  author: string;
  content: string;
  date: string;
  type: 'news' | 'shoutout';
}

interface GroupPost {
    id: string;
    groupId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    date: string;
    likes: number;
    comments: number;
    isLiked?: boolean; 
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Completed';
  dueDate: string;
}

interface Skill {
    name: string;
    level: number; 
    target: number; 
}

interface Request {
    id: string;
    type: 'leave' | 'expense' | 'ticket' | 'profile';
    requester: string;
    requesterId?: string;
    title: string;
    details: string;
    amount?: string;
    status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected' | 'Resolved';
    date: string;
    assigneeId?: string; 
    payload?: any; 
}

interface TimeEntry {
    id: string;
    date: string;
    in: string;
    out: string | null;
    duration?: string;
}

interface PayrollEntry {
    userId: string;
    baseSalary: number;
    bonus: number;
    deductions: number;
    currency: string;
    status: 'Draft' | 'Approved' | 'Paid';
    payoutDate: string;
}

interface Asset {
    id: string;
    type: 'Laptop' | 'Monitor' | 'Phone' | 'Peripheral';
    model: string;
    serialNumber: string;
    assignedTo?: string; 
    status: 'In Use' | 'Available' | 'Repair' | 'Retired';
    purchaseDate: string;
}

interface Group {
    id: string;
    name: string;
    description: string;
    icon: any;
    members: number;
    isMember: boolean;
    color: string;
}

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    type: 'Company' | 'Social';
    groupId?: string; 
}

interface PerformanceCycle {
    id: string;
    title: string;
    period: string;
    status: 'Active' | 'Draft' | 'Closed';
    completion: number;
    deadline: string;
}

// --- MOCK DATA ---

const INITIAL_USERS: User[] = [
  { 
      id: '1', name: 'Jane Executive', role: 'ceo', avatar: 'JE', department: 'Leadership', location: 'New York', managerId: null, status: 'Active', email: 'jane@acme.com', phone: '+1 202 555 0101',
      startDate: '2020-01-01', contractType: 'Full-Time', vacationEntitlement: 30, vacationUsed: 12, sickDays: 0, address: '123 Wall St, NY', emergencyContact: 'Mark Executive (Husband)', iban: 'US123456789'
  },
  { 
      id: '2', name: 'Mike VP', role: 'vp', avatar: 'MV', department: 'Engineering', location: 'London', managerId: '1', status: 'Active', email: 'mike@acme.com', phone: '+44 20 7946 0123',
      startDate: '2021-03-15', contractType: 'Full-Time', vacationEntitlement: 28, vacationUsed: 20, sickDays: 2, address: '45 Oxford St, London', emergencyContact: 'Sarah VP (Wife)', iban: 'GB123456789'
  },
  { 
      id: '3', name: 'Anna Mueller', role: 'hr', avatar: 'AM', department: 'People', location: 'Berlin', managerId: '1', status: 'Active', email: 'anna@acme.com', phone: '+49 30 123456',
      startDate: '2019-06-01', contractType: 'Full-Time', vacationEntitlement: 30, vacationUsed: 5, sickDays: 4, address: 'Torstraße 1, Berlin', emergencyContact: 'Hans Mueller (Father)', iban: 'DE123456789'
  },
  { 
      id: '4', name: 'Sarah Smith', role: 'manager', avatar: 'SS', department: 'Engineering', location: 'London', managerId: '2', status: 'Active', email: 'sarah@acme.com', phone: '+44 7700 900555',
      startDate: '2022-01-10', contractType: 'Full-Time', vacationEntitlement: 25, vacationUsed: 15, sickDays: 1, address: '10 Baker St, London', emergencyContact: 'John Smith (Brother)', iban: 'GB987654321'
  },
  { 
      id: '5', name: 'John Doe', role: 'employee', avatar: 'JD', department: 'Engineering', location: 'Remote', managerId: '4', status: 'Active', email: 'john@acme.com', phone: '+1 555 0199',
      startDate: '2023-05-01', contractType: 'Full-Time', vacationEntitlement: 25, vacationUsed: 0, sickDays: 0, address: 'Remote Blvd 99', emergencyContact: 'Jane Doe (Mother)', iban: 'US987654321'
  },
  { 
      id: '6', name: 'Emily Dev', role: 'employee', avatar: 'ED', department: 'Engineering', location: 'Berlin', managerId: '4', status: 'Onboarding', email: 'emily@acme.com', phone: '+49 151 555666',
      startDate: '2023-11-01', contractType: 'Part-Time', vacationEntitlement: 15, vacationUsed: 0, sickDays: 0, address: 'Kreuzberg 55, Berlin', emergencyContact: 'Tom Dev (Partner)', iban: 'DE987654321'
  },
  { 
      id: '7', name: 'David IT', role: 'it_admin', avatar: 'DI', department: 'IT', location: 'Berlin', managerId: '2', status: 'Active', email: 'david@acme.com', phone: '+49 30 999888',
      startDate: '2021-01-01', contractType: 'Full-Time', vacationEntitlement: 30, vacationUsed: 10, sickDays: 1, address: 'Server Room 1', emergencyContact: 'The Internet', iban: 'DE11223344'
  },
];

const INITIAL_JOBS: Job[] = [
  { id: 'j1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Berlin', applicants: 12, stage: 'Published' },
  { id: 'j2', title: 'Product Manager', department: 'Product', location: 'London', applicants: 5, stage: 'Published' },
  { id: 'j3', title: 'HR Generalist', department: 'People', location: 'Berlin', applicants: 0, stage: 'Draft' },
];

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'c1', jobId: 'j1', name: 'Felix Kjellberg', stage: 'Screening', rating: 4, email: 'felix@example.com', phone: '+49 123 456789', appliedDate: '2 days ago', skills: ['React', 'TypeScript'], source: 'LinkedIn', currentRole: 'Frontend Dev', company: 'StartUp GmbH' },
  { id: 'c2', jobId: 'j1', name: 'Mark Fisher', stage: 'Applied', rating: 0, email: 'mark@example.com', phone: '+44 7700 900077', appliedDate: '5 hours ago', skills: ['Vue.js', 'Node'], source: 'Referral', referrer: 'John Doe', currentRole: 'Web Developer', company: 'Agency XYZ' },
];

const INITIAL_POSTS: Post[] = [
  { id: 'p1', author: 'Admin Team', content: 'We are excited to announce our new office location in Kreuzberg! Join us for the opening party next Friday.', date: '2 hours ago', type: 'news' }
];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Ship HR Suite v1.0', progress: 75, status: 'On Track', dueDate: 'Dec 15, 2023' },
  { id: 'g2', title: 'Master Typescript Generics', progress: 30, status: 'At Risk', dueDate: 'Jan 20, 2024' }
];

const INITIAL_SKILLS: Skill[] = [
    { name: 'React / Frontend', level: 4, target: 5 },
    { name: 'Backend / Node', level: 2, target: 3 },
    { name: 'Leadership', level: 1, target: 2 }
];

const INITIAL_GROUPS: Group[] = [
    { id: 'gr1', name: 'Coffee Lovers', description: 'Weekly tastings & cafe tours.', icon: Coffee, members: 12, isMember: false, color: 'orange' },
    { id: 'gr2', name: 'Book Club', description: 'Monthly reads & discussions.', icon: BookOpen, members: 8, isMember: true, color: 'blue' },
    { id: 'gr3', name: 'Jam Session', description: 'Musicians of Acme Corp.', icon: Music, members: 5, isMember: false, color: 'purple' },
];

const INITIAL_GROUP_POSTS: GroupPost[] = [
    { id: 'gp1', groupId: 'gr1', authorName: 'John Doe', authorAvatar: 'JD', content: 'Has anyone tried the new roastery on Main St?', date: '2 hours ago', likes: 4, comments: 2, isLiked: false },
    { id: 'gp2', groupId: 'gr1', authorName: 'Sarah Smith', authorAvatar: 'SS', content: 'Bringing some Ethiopian beans tomorrow!', date: 'Yesterday', likes: 8, comments: 1, isLiked: true },
    { id: 'gp3', groupId: 'gr2', authorName: 'Anna Mueller', authorAvatar: 'AM', content: 'Next months book: Atomic Habits. Thoughts?', date: '3 days ago', likes: 5, comments: 4, isLiked: false },
];

const INITIAL_EVENTS: Event[] = [
    { id: 'ev1', title: 'Town Hall Meeting', date: '2023-11-24', time: '14:00 - 15:30', location: 'Online', type: 'Company' },
    { id: 'ev2', title: 'Holiday Party', date: '2023-12-15', time: '18:00 - Late', location: 'Berlin HQ', type: 'Social' },
    { id: 'ev3', title: 'Morning Coffee', date: '2023-11-25', time: '09:00 - 09:30', location: 'Kitchen', type: 'Social', groupId: 'gr1' },
];

const INITIAL_CYCLES: PerformanceCycle[] = [
    { id: 'pc1', title: 'Q4 2023 Performance Review', period: 'Oct - Dec 2023', status: 'Active', completion: 45, deadline: 'Dec 20, 2023' },
    { id: 'pc2', title: 'Q3 2023 Performance Review', period: 'Jul - Sep 2023', status: 'Closed', completion: 100, deadline: 'Sep 30, 2023' },
];

const INITIAL_REQUESTS: Request[] = [
    { id: 'r1', type: 'leave', requester: 'Sarah Smith', title: 'Vacation', details: 'Dec 24 - Dec 31', status: 'Pending', date: 'Yesterday' },
    { id: 'r2', type: 'expense', requester: 'John Doe', title: 'Team Lunch', details: 'Pizza for release party', amount: '120.50', status: 'Pending', date: 'Today' },
    { id: 'r3', type: 'ticket', requester: 'Mike VP', title: 'Laptop Issue', details: 'Screen flickering occasionally', status: 'Pending', date: '2 days ago' },
    { id: 'r4', type: 'ticket', requester: 'Sarah Smith', title: 'VPN Access', details: 'Need access to staging environment', status: 'In Progress', date: '1 day ago', assigneeId: '7' }
];

const INITIAL_TIME_ENTRIES: TimeEntry[] = [
    { id: 't1', date: '2023-11-20', in: '09:00', out: '17:30', duration: '8h 30m' },
    { id: 't2', date: '2023-11-21', in: '09:15', out: '18:00', duration: '8h 45m' },
];

const INITIAL_PAYROLL: PayrollEntry[] = [
    { userId: '1', baseSalary: 15000, bonus: 0, deductions: 0, currency: 'EUR', status: 'Draft', payoutDate: '2023-11-28' },
    { userId: '2', baseSalary: 12000, bonus: 2000, deductions: 0, currency: 'EUR', status: 'Draft', payoutDate: '2023-11-28' },
    { userId: '3', baseSalary: 7000, bonus: 0, deductions: 50, currency: 'EUR', status: 'Draft', payoutDate: '2023-11-28' },
    { userId: '4', baseSalary: 8500, bonus: 1500, deductions: 0, currency: 'GBP', status: 'Draft', payoutDate: '2023-11-28' },
    { userId: '5', baseSalary: 6000, bonus: 0, deductions: 0, currency: 'USD', status: 'Draft', payoutDate: '2023-11-28' },
    { userId: '6', baseSalary: 5500, bonus: 500, deductions: 0, currency: 'EUR', status: 'Draft', payoutDate: '2023-11-28' },
];

const INITIAL_ASSETS: Asset[] = [
    { id: 'a1', type: 'Laptop', model: 'MacBook Pro 16"', serialNumber: 'C02XXXXX', assignedTo: '2', status: 'In Use', purchaseDate: '2023-01-15' },
    { id: 'a2', type: 'Laptop', model: 'Dell XPS 13', serialNumber: 'DL12345', assignedTo: '5', status: 'In Use', purchaseDate: '2023-05-10' },
    { id: 'a3', type: 'Monitor', model: 'Dell UltraSharp 27"', serialNumber: 'M123456', assignedTo: '5', status: 'In Use', purchaseDate: '2023-05-10' },
    { id: 'a4', type: 'Laptop', model: 'MacBook Air M2', serialNumber: 'C02YYYYY', status: 'Available', purchaseDate: '2023-10-01' },
];

// Mock crawler results
const MOCK_SOURCING_RESULTS: ExternalProfile[] = [
    { id: 'e1', name: 'Julia Chen', currentRole: 'Senior React Developer', company: 'Tech Giant Inc.', location: 'Berlin', skills: ['React', 'Redux', 'Node.js', 'AWS'], matchScore: 95, avatar: 'JC', source: 'LinkedIn' },
    { id: 'e2', name: 'Thomas Mueller', currentRole: 'Fullstack Engineer', company: 'Digital Solutions', location: 'Munich', skills: ['Angular', 'Java', 'SQL'], matchScore: 70, avatar: 'TM', source: 'Xing' },
    { id: 'e3', name: 'Sarah Connor', currentRole: 'Frontend Architect', company: 'Skynet Corp', location: 'Remote', skills: ['React', 'TypeScript', 'GraphQL'], matchScore: 88, avatar: 'SC', source: 'GitHub' },
];

// --- SHARED COMPONENTS ---

const NavItem = ({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active?: boolean, onClick: () => void, badge?: number }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center space-x-3">
        <Icon size={18} />
        <span>{label}</span>
    </div>
    {badge ? <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span> : null}
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color = "indigo" }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
    <div className={`p-3 bg-${color}-50 rounded-lg text-${color}-600`}>
      <Icon size={20} />
    </div>
  </div>
);

// Generic Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, size?: 'md' | 'lg' | 'xl' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-0 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Generic Toast Component
const Toast = ({ message, onClose }: { message: string | null, onClose: () => void }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
      <CheckCircle size={20} className="text-green-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Smart Assistant Component (Using Google GenAI)
const SmartAssistant = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMsg,
        });
        setMessages(prev => [...prev, { role: 'model', text: response.text || "I couldn't generate a response." }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI service." }]);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed bottom-20 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
       <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold">
             <Sparkles size={18} className="text-yellow-300 fill-yellow-300"/> PeopleOS AI
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={18}/></button>
       </div>
       <div className="flex-1 p-4 bg-slate-50 min-h-[300px] max-h-[400px] overflow-y-auto space-y-4">
          {messages.length === 0 && (
             <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">AI</div>
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 shadow-sm border border-slate-100">
                    Hi there! I can help you with company policies, your personal data, or finding colleagues. What do you need today?
                 </div>
             </div>
          )}
          
          {messages.map((m, i) => (
             <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {m.role === 'user' ? 'ME' : 'AI'}
                 </div>
                 <div className={`p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {m.text}
                 </div>
             </div>
          ))}

          {loading && (
             <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">AI</div>
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 shadow-sm border border-slate-100 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
       </div>
       <div className="p-3 bg-white border-t border-slate-100">
          <div className="relative">
             <input 
                type="text" 
                placeholder="Ask anything..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
             />
             <button onClick={handleSend} className="absolute right-2 top-1.5 p-1 bg-indigo-600 rounded-full text-white hover:bg-indigo-700"><ArrowRight size={14}/></button>
          </div>
       </div>
    </div>
  );
};

// --- AUTH COMPONENTS ---

const AuthView = ({ onLogin }: { onLogin: (isAdmin: boolean) => void }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'login') {
            // Master Account Check
            if (email === 'admin@suite.io' && password === 'master123') {
                onLogin(true);
            } else {
                setError('Invalid credentials. (Hint: Use Master Account)');
            }
        } else if (mode === 'signup') {
            // Mock Signup
            if (email && password) {
                onLogin(false); // Log in as regular user/demo
            } else {
                setError('Please fill in all fields');
            }
        } else {
            alert('Reset link sent to ' + email);
            setMode('login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">HR</div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                        {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                    </h2>
                    <p className="text-slate-500 text-center text-sm mb-8">
                        {mode === 'login' ? 'Enter your credentials to access the suite.' : mode === 'signup' ? 'Get started with your free account.' : 'Enter your email to receive a reset link.'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="email" 
                                    required 
                                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        {mode !== 'forgot' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                                <div className="relative">
                                    <LockKeyhole size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="password" 
                                        required 
                                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-2 text-center text-sm">
                        {mode === 'login' ? (
                            <>
                                <button onClick={() => setMode('forgot')} className="text-indigo-600 hover:underline">Forgot password?</button>
                                <p className="text-slate-500">Don't have an account? <button onClick={() => setMode('signup')} className="text-indigo-600 font-medium hover:underline">Sign up</button></p>
                            </>
                        ) : mode === 'signup' ? (
                            <p className="text-slate-500">Already have an account? <button onClick={() => setMode('login')} className="text-indigo-600 font-medium hover:underline">Log in</button></p>
                        ) : (
                            <button onClick={() => setMode('login')} className="text-indigo-600 font-medium hover:underline">Back to Login</button>
                        )}
                    </div>
                </div>
                {mode === 'login' && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">Master Login: <span className="font-mono bg-slate-200 px-1 rounded text-slate-600">admin@suite.io</span> / <span className="font-mono bg-slate-200 px-1 rounded text-slate-600">master123</span></p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- HUB SUB-PAGES ---

const HubDashboard = ({ currentUser, onAction, isClockedIn, onToggleClock, posts, events }: { currentUser: User, onAction: (action: string) => void, isClockedIn: boolean, onToggleClock: () => void, posts: Post[], events: Event[] }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {currentUser.name.split(' ')[0]}!</h1>
        <p className="text-slate-500">Here's what's happening at Acme Corp today.</p>
      </div>
      <div className="flex gap-3">
          <button 
            onClick={() => onAction('shoutout')}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <Heart size={16} className="text-pink-500"/>
            Give Shoutout
          </button>
          <button 
            onClick={onToggleClock}
            className={`${isClockedIn ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-slate-900 hover:bg-slate-800 text-white'} transition-colors px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2`}
          >
            <Clock size={16} />
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => onAction('leave')} className="p-4 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center flex flex-col items-center gap-2 group bg-white">
             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
               <Calendar size={20} />
             </div>
             <span className="block text-sm font-medium text-slate-700">Request Leave</span>
          </button>
          <button onClick={() => onAction('expense')} className="p-4 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center flex flex-col items-center gap-2 group bg-white">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
               <CreditCard size={20} />
             </div>
             <span className="block text-sm font-medium text-slate-700">Expense</span>
          </button>
          <button onClick={() => onAction('referral')} className="p-4 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center flex flex-col items-center gap-2 group bg-white">
             <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
               <Users size={20} />
             </div>
             <span className="block text-sm font-medium text-slate-700">Referral</span>
          </button>
          <button onClick={() => onAction('ticket')} className="p-4 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center flex flex-col items-center gap-2 group bg-white">
             <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
               <Laptop size={20} />
             </div>
             <span className="block text-sm font-medium text-slate-700">IT Ticket</span>
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Upcoming Events</h3>
        <div className="space-y-4 max-h-[150px] overflow-y-auto">
            {events.slice(0,2).map(ev => (
                <div key={ev.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center leading-none border border-indigo-100 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase">{ev.date.split('-')[1]}</span>
                        <span className="text-sm font-bold">{ev.date.split('-')[2]}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{ev.title}</p>
                        <p className="text-xs text-slate-500">{ev.time}</p>
                    </div>
                </div>
            ))}
            <button onClick={() => onAction('community')} className="text-xs text-indigo-600 font-medium hover:underline block w-full text-center pt-2">View Calendar</button>
        </div>
      </div>
    </div>
    
    {/* Culture/Events Feed */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Company News</h3>
          <Building size={16} className="text-slate-400"/>
        </div>
        <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
          {posts.length === 0 && <p className="text-slate-400 text-sm text-center italic">No news yet.</p>}
          {posts.map(post => (
            <div key={post.id} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${post.type === 'shoutout' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                {post.type === 'shoutout' ? <Heart size={20}/> : <Award size={20} />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{post.content}</p>
                <p className="text-xs text-slate-400 mt-2">{post.date} • {post.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
           <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Heart size={18} className="fill-white"/> Featured Shoutout</h3>
           <p className="text-indigo-100 text-sm mb-4">"Big thanks to <span className="font-bold text-white">@Sarah</span> for helping me with the React migration yesterday! You are a lifesaver."</p>
           <div className="flex items-center gap-2 mt-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">JD</div>
              <span className="text-xs text-indigo-200">John Doe to Sarah Smith</span>
           </div>
        </div>
        <Award className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10" />
      </div>
    </div>
  </div>
);

// REFACTORED: HubTime with Team Calendar Switcher
const HubTime = ({ onAction, timeEntries }: { onAction: (action: string) => void, timeEntries: TimeEntry[] }) => {
    const [view, setView] = useState<'me' | 'team'>('me');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900">Time & Absence</h2>
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button onClick={() => setView('me')} className={`px-3 py-1.5 rounded-md transition-all ${view === 'me' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>My Overview</button>
                        <button onClick={() => setView('team')} className={`px-3 py-1.5 rounded-md transition-all ${view === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Team Calendar</button>
                    </div>
                </div>
                <button onClick={() => onAction('leave')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <UserPlus size={16} /> Request Time Off
                </button>
            </div>
            
            {view === 'me' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-xs font-semibold uppercase">Annual Leave</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">18 <span className="text-base text-slate-400 font-normal">/ 30 days</span></h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-xs font-semibold uppercase">Sick Days</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">3 <span className="text-base text-slate-400 font-normal">days taken</span></h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-xs font-semibold uppercase">Remote Work</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">42 <span className="text-base text-slate-400 font-normal">days taken</span></h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 font-semibold text-slate-800">Timesheet (Clock In/Out)</div>
                            <div className="max-h-64 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">In</th>
                                        <th className="px-6 py-3">Out</th>
                                        <th className="px-6 py-3">Duration</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {timeEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td className="px-6 py-3 text-slate-900">{entry.date}</td>
                                            <td className="px-6 py-3 text-slate-600">{entry.in}</td>
                                            <td className="px-6 py-3 text-slate-600">{entry.out || '-'}</td>
                                            <td className="px-6 py-3 text-slate-600">{entry.duration || 'Active'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 font-semibold text-slate-800">Recent Absence Requests</div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Dates</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="px-6 py-4 font-medium">Vacation</td>
                                    <td className="px-6 py-4 text-slate-600">Dec 24 - Dec 31</td>
                                    <td className="px-6 py-4"><span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Pending</span></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Team Availability (November 2023)</h3>
                        <div className="flex gap-2 text-sm">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 rounded"></div> Vacation</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded"></div> Sick</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 rounded"></div> Remote</div>
                        </div>
                    </div>
                    {/* Mock Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
                        ))}
                        {Array.from({length: 30}).map((_, i) => (
                            <div key={i} className={`bg-white h-28 p-2 relative hover:bg-slate-50 transition-colors ${i === 20 ? 'bg-slate-50/50' : ''}`}>
                                <span className="text-xs font-semibold text-slate-400 absolute top-2 right-2">{i+1}</span>
                                <div className="mt-4 space-y-1">
                                    {i === 12 && <div className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-1 rounded truncate border border-yellow-200 font-medium">🌴 John (Vacation)</div>}
                                    {i === 13 && <div className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-1 rounded truncate border border-yellow-200 font-medium">🌴 John (Vacation)</div>}
                                    {i === 20 && <div className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-1 rounded truncate border border-blue-200 font-medium">🤧 Sarah (Sick)</div>}
                                    {i === 24 && <div className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-1 rounded truncate border border-indigo-100 font-medium">🏠 Mike (Remote)</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const HubGrow = ({ goals, skills, onAddGoal }: { goals: Goal[], skills: Skill[], onAddGoal: () => void }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex justify-between items-center">
      <div>
          <h2 className="text-2xl font-bold text-slate-900">Career & Growth</h2>
          <p className="text-slate-500">Your development plan and skills matrix.</p>
      </div>
      <button onClick={onAddGoal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
        <Target size={16} /> Add Development Goal
      </button>
    </div>

    {/* Career Path Visualization */}
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 top-1/2 -z-0"></div>
        
        <div className="z-10 flex flex-col items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-200 border-4 border-white flex items-center justify-center font-bold text-slate-500 text-xs">I</div>
            <p className="text-xs font-semibold text-slate-400">Junior</p>
        </div>
        
        <div className="z-10 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center font-bold text-white">II</div>
            <div className="text-center">
                <p className="text-sm font-bold text-indigo-700">Software Engineer II</p>
                <p className="text-xs text-indigo-500">Current Role</p>
            </div>
        </div>

        <div className="z-10 flex flex-col items-center gap-2 opacity-70">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center font-bold text-slate-400 text-xs">III</div>
            <p className="text-xs font-semibold text-slate-500">Senior Engineer</p>
        </div>

        <div className="z-10 flex flex-col items-center gap-2 opacity-40">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-300 text-xs">IV</div>
            <p className="text-xs font-semibold text-slate-400">Staff Engineer</p>
        </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       {/* Development Goals */}
       <div className="space-y-4">
           <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><List size={20}/> Development Plan</h3>
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="divide-y divide-slate-100">
                   {goals.map(goal => (
                       <div key={goal.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                           <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${goal.status === 'On Track' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                               <div>
                                   <p className="font-medium text-slate-900 text-sm">{goal.title}</p>
                                   <p className="text-xs text-slate-500">Due: {goal.dueDate}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-3">
                               <div className="w-24 bg-slate-100 rounded-full h-1.5">
                                   <div className={`h-1.5 rounded-full ${goal.status === 'On Track' ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${goal.progress}%` }}></div>
                               </div>
                               <span className="text-xs font-medium text-slate-600">{goal.progress}%</span>
                           </div>
                       </div>
                   ))}
               </div>
               <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                   <button className="text-xs font-medium text-indigo-600 hover:underline">View Archived Goals</button>
               </div>
           </div>
       </div>

       {/* Skills Matrix */}
       <div className="space-y-4">
           <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Zap size={20}/> Skills Matrix</h3>
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
               {skills.map(skill => (
                   <div key={skill.name}>
                       <div className="flex justify-between mb-1">
                           <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                           <span className="text-xs text-slate-500">Level {skill.level} / {skill.target}</span>
                       </div>
                       <div className="flex gap-1">
                           {[1, 2, 3, 4, 5].map(level => (
                               <div 
                                key={level} 
                                className={`h-2 flex-1 rounded-full ${
                                    level <= skill.level ? 'bg-indigo-600' : 
                                    level <= skill.target ? 'bg-indigo-100 border border-indigo-200' : 
                                    'bg-slate-100'
                                }`}
                               ></div>
                           ))}
                       </div>
                   </div>
               ))}
               <p className="text-xs text-slate-400 italic mt-4">* Skills are assessed during bi-annual performance reviews.</p>
           </div>
       </div>
    </div>
  </div>
);

const HubProfile = ({ currentUser, onEdit }: { currentUser: User, onEdit: () => void }) => (
  <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative animate-in fade-in duration-500">
      <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          <button 
            onClick={onEdit} 
            className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg z-20 cursor-pointer"
          >
              <PenTool size={16}/> Request Changes
          </button>
      </div>
      <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-4">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                   <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
                      {currentUser.avatar}
                   </div>
              </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{currentUser.name}</h1>
          <p className="text-slate-500 capitalize">{currentUser.role} • {currentUser.department}</p>
          
          <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={18} /> {currentUser.email}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={18} /> {currentUser.phone || 'No phone provided'}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={18} /> {currentUser.address || 'No address provided'}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <Landmark size={18} /> {currentUser.iban || 'No IBAN provided'}
              </div>
          </div>
      </div>
  </div>
);

// REFACTORED: HubGroupDetail (Deep Dive View)
const HubGroupDetail = ({ group, posts, users, events, onBack, currentUser, onCreateEvent }: { group: Group, posts: GroupPost[], users: User[], events: Event[], onBack: () => void, currentUser: User, onCreateEvent: () => void }) => {
    const [activeTab, setActiveTab] = useState<'Feed' | 'Members' | 'Events'>('Feed');
    const [newPost, setNewPost] = useState('');
    const [groupPosts, setGroupPosts] = useState<GroupPost[]>(posts);
    const [commentingId, setCommentingId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newPost.trim()) return;
        
        const post: GroupPost = {
            id: Date.now().toString(),
            groupId: group.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            content: newPost,
            date: 'Just now',
            likes: 0,
            comments: 0
        };
        setGroupPosts([post, ...groupPosts]);
        setNewPost('');
    };

    const handleLike = (id: string) => {
        setGroupPosts(groupPosts.map(p => {
            if (p.id === id) {
                return { 
                    ...p, 
                    isLiked: !p.isLiked,
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1 
                };
            }
            return p;
        }));
    };

    const handleSubmitComment = (id: string) => {
        if (!commentText.trim()) return;
        setGroupPosts(groupPosts.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
        setCommentingId(null);
        setCommentText('');
    };

    // Filter members (simulated for now by picking 5 random users)
    const members = users.slice(0, group.members);
    const groupEvents = events.filter(e => e.groupId === group.id);

    const Icon = group.icon;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className={`bg-gradient-to-r from-${group.color}-500 to-${group.color}-700 rounded-xl p-8 text-white shadow-md relative overflow-hidden`}>
                <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center justify-center text-center mt-4 relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 text-white">
                        <Icon size={40} />
                    </div>
                    <h1 className="text-3xl font-bold">{group.name}</h1>
                    <p className="text-white/80 mt-2 max-w-lg">{group.description}</p>
                    <div className="flex gap-4 mt-6">
                        <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-medium flex items-center gap-1"><Users size={12}/> {group.members} Members</span>
                        {group.isMember ? (
                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Member</span>
                        ) : (
                            <button className="px-4 py-1 bg-white text-slate-900 rounded-full text-xs font-bold hover:bg-slate-100">Join Group</button>
                        )}
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {['Feed', 'Members', 'Events'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 font-medium text-sm transition-colors border-b-2 px-2 ${activeTab === tab ? `border-${group.color}-600 text-${group.color}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'Feed' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Create Post */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 flex-shrink-0">{currentUser.avatar}</div>
                            <form onSubmit={handlePost} className="flex-1">
                                <textarea 
                                    className="w-full border-none focus:ring-0 resize-none text-sm text-slate-700 placeholder:text-slate-400 h-20 p-2 bg-white text-slate-900"
                                    placeholder={`Share something with ${group.name}...`}
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                ></textarea>
                                <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                                    <div className="flex gap-2">
                                        <button type="button" className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ImageIcon size={18}/></button>
                                        <button type="button" className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><Paperclip size={18}/></button>
                                    </div>
                                    <button type="submit" className={`px-4 py-2 bg-${group.color}-600 text-white rounded-lg text-sm font-medium hover:bg-${group.color}-700 transition-colors`}>Post</button>
                                </div>
                            </form>
                        </div>

                        {/* Feed Stream */}
                        <div className="space-y-4">
                            {groupPosts.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 italic">Be the first to post!</div>
                            ) : (
                                groupPosts.map(post => (
                                    <div key={post.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{post.authorAvatar}</div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{post.authorName}</h4>
                                                    <p className="text-xs text-slate-500">{post.date}</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16}/></button>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>
                                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex gap-6">
                                                <button 
                                                    onClick={() => handleLike(post.id)}
                                                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${post.isLiked ? 'text-pink-600' : 'text-slate-500 hover:text-pink-600'}`}
                                                >
                                                    <Heart size={16} className={post.isLiked ? 'fill-pink-600' : ''}/> {post.likes} Likes
                                                </button>
                                                <button 
                                                    onClick={() => setCommentingId(commentingId === post.id ? null : post.id)}
                                                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-500 transition-colors"
                                                >
                                                    <MessageSquare size={16}/> {post.comments} Comments
                                                </button>
                                            </div>
                                            {commentingId === post.id && (
                                                <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Write a comment..." 
                                                        className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Members' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map(m => (
                            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{m.avatar}</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                                    <p className="text-xs text-slate-500">{m.role} • {m.department}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Events' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                             <h4 className="font-bold text-slate-700">Group Events</h4>
                             <button onClick={onCreateEvent} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700">Schedule Meetup</button>
                        </div>
                        {groupEvents.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
                                No upcoming events for this group.
                            </div>
                        ) : (
                            groupEvents.map(ev => (
                                <div key={ev.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-16 h-16 rounded-xl bg-${group.color}-50 text-${group.color}-600 flex flex-col items-center justify-center border border-${group.color}-100`}>
                                            <span className="text-xs font-bold uppercase">{ev.date.split('-')[1]}</span>
                                            <span className="text-2xl font-bold">{ev.date.split('-')[2]}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{ev.title}</h4>
                                            <p className="text-sm text-slate-500">{ev.time} • {ev.location}</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">RSVP</button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// REFACTORED: HubCommunity (Events & Groups List)
const HubCommunity = ({ groups, events, onJoinGroup, onCreateEvent, onSelectGroup }: { groups: Group[], events: Event[], onJoinGroup: (id: string) => void, onCreateEvent: () => void, onSelectGroup: (g: Group) => void }) => (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Community & Culture</h2>
                <p className="text-slate-500">Connect with colleagues beyond work.</p>
            </div>
            <button onClick={onCreateEvent} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                <Plus size={16} /> Create Event
            </button>
        </div>

        {/* Employee Resource Groups */}
        <div>
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Smile size={20}/> Interest Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {groups.map(group => {
                    const Icon = group.icon;
                    return (
                        <div 
                            key={group.id} 
                            onClick={() => onSelectGroup(group)}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group-card"
                        >
                            <div>
                                <div className={`w-12 h-12 bg-${group.color}-100 text-${group.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                                    <Icon size={24} />
                                </div>
                                <h4 className="font-bold text-slate-900">{group.name}</h4>
                                <p className="text-sm text-slate-500 mt-1">{group.description}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-500 font-bold">+{group.members}</div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onJoinGroup(group.id); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${group.isMember ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {group.isMember ? 'Joined' : 'Join'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Upcoming Events */}
        <div>
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Calendar size={20}/> Upcoming Events</h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {events.map(ev => (
                        <div key={ev.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                            <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center border ${ev.type === 'Company' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                                <span className="text-xs font-bold uppercase">{ev.date.split('-')[1]}</span>
                                <span className="text-xl font-bold">{ev.date.split('-')[2]}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{ev.title}</h4>
                                <p className="text-sm text-slate-500">{ev.type} • {ev.location}</p>
                                <span className="text-xs text-slate-400 mt-1 block">{ev.time}</span>
                            </div>
                            <button className="ml-auto px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 h-fit text-slate-700">RSVP</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// NEW: Hub Directory (Searchable People List) - List View
const HubDirectory = ({ users, onSelectUser }: { users: User[], onSelectUser: (u: User) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [locFilter, setLocFilter] = useState('All');
    
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              u.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'All' || u.department === deptFilter;
        const matchesLoc = locFilter === 'All' || u.location === locFilter;
        return matchesSearch && matchesDept && matchesLoc;
    });

    const departments = ['All', ...Array.from(new Set(users.map(u => u.department)))];
    const locations = ['All', ...Array.from(new Set(users.map(u => u.location)))];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">People Directory</h2>
                </div>
                
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or role..." 
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 min-w-[150px]"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                    >
                        {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
                    </select>
                    <select 
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 min-w-[150px]"
                        value={locFilter}
                        onChange={(e) => setLocFilter(e.target.value)}
                    >
                        {locations.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Department</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} onClick={() => onSelectUser(user)} className="hover:bg-slate-50 group cursor-pointer">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                        {user.avatar}
                                    </div>
                                    <span className="font-medium text-slate-900">{user.name}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 capitalize">{user.role}</td>
                                <td className="px-6 py-4 text-slate-600"><span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{user.department}</span></td>
                                <td className="px-6 py-4 text-slate-600">{user.location}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onSelectUser(user); }}
                                        className="text-indigo-600 font-medium hover:underline text-xs"
                                    >
                                        View Contact
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No employees found.</div>
                )}
            </div>
        </div>
    );
};

const HubDocs = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Employee Handbook', 'Insurance Policy', 'Brand Guidelines', 'Holiday Calendar', 'Expense Policy'].map((doc, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="font-medium text-slate-900">{doc}</h3>
                        <p className="text-xs text-slate-400">PDF • 2.4 MB</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- ADMIN SUB-PAGES ---

const AdminPayroll = ({ users, entries, onUpdateEntry, onRunPayroll }: { users: User[], entries: PayrollEntry[], onUpdateEntry: (userId: string, bonus: number, deductions: number) => void, onRunPayroll: () => void }) => {
    // Stats calculation
    const totalPayroll = entries.reduce((acc, curr) => acc + curr.baseSalary + curr.bonus - curr.deductions, 0);
    const totalPending = entries.filter(e => e.status !== 'Paid').length;
    const avgSalary = Math.round(totalPayroll / (entries.length || 1));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Payroll Run</h2>
                <button onClick={onRunPayroll} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <DollarSign size={16} /> Run Payroll
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Payroll" value={`€${totalPayroll.toLocaleString()}`} sub="Current Run" icon={Banknote} color="emerald" />
                <StatCard label="Avg. Payout" value={`€${avgSalary.toLocaleString()}`} sub="Per Employee" icon={Calculator} color="blue" />
                <StatCard label="Pending" value={totalPending} sub="To Process" icon={Clock} color="orange" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Base Salary</th>
                            <th className="px-6 py-3">Bonus</th>
                            <th className="px-6 py-3">Deductions</th>
                            <th className="px-6 py-3">Net Payout</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map(entry => {
                            const user = users.find(u => u.id === entry.userId);
                            if (!user) return null;
                            const net = entry.baseSalary + entry.bonus - entry.deductions;
                            return (
                                <tr key={entry.userId} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{entry.baseSalary.toLocaleString()} {entry.currency}</td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number" 
                                            className="w-20 border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-900" 
                                            value={entry.bonus} 
                                            onChange={(e) => onUpdateEntry(entry.userId, Number(e.target.value), entry.deductions)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                         <input 
                                            type="number" 
                                            className="w-20 border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-900" 
                                            value={entry.deductions} 
                                            onChange={(e) => onUpdateEntry(entry.userId, entry.bonus, Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{net.toLocaleString()} {entry.currency}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{entry.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// New: Admin Inbox / Workflows showing requests
const AdminInbox = ({ requests, onApprove, onReject }: { requests: Request[], onApprove: (id:string)=>void, onReject: (id:string)=>void }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex items-center justify-between">
       <h2 className="text-2xl font-bold text-slate-900">Manager Inbox</h2>
       <div className="flex gap-2">
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider self-center">Showing All</span>
       </div>
    </div>

    <div className="grid grid-cols-1 gap-6">
        {/* Expenses & Leaves */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between">
                <h3 className="font-semibold text-slate-800">Pending Approvals</h3>
            </div>
            {requests.filter(r => r.status === 'Pending' && r.type !== 'ticket').length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No pending requests. Good job!</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {requests.filter(r => r.status === 'Pending' && r.type !== 'ticket').map(req => (
                        <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.type === 'expense' ? 'bg-emerald-100 text-emerald-600' : req.type === 'profile' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {req.type === 'expense' ? <DollarSign size={20}/> : req.type === 'profile' ? <UserCheck size={20}/> : <Calendar size={20}/>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{req.title} <span className="font-normal text-slate-500">by {req.requester}</span></p>
                                    <p className="text-xs text-slate-500">{req.details} {req.amount && `• €${req.amount}`} • {req.date}</p>
                                    {req.type === 'profile' && req.payload && (
                                        <div className="mt-1 text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                                            <span className="font-bold">Requested Changes:</span>
                                            <ul className="list-disc list-inside mt-1">
                                                {Object.entries(req.payload).map(([k,v]) => v && <li key={k} className="capitalize">{k}: {String(v)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onReject(req.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium border border-transparent hover:border-red-100 transition-all">Reject</button>
                                <button onClick={() => onApprove(req.id)} className="p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-medium shadow-sm transition-all">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-80">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-100">
                 {requests.filter(r => r.status !== 'Pending' && r.type !== 'ticket').map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400`}>
                                    {req.type === 'expense' ? <DollarSign size={16}/> : <Calendar size={16}/>}
                             </div>
                             <div>
                                <p className="text-sm font-medium text-slate-700">{req.title} ({req.requester})</p>
                                <p className="text-xs text-slate-400">{req.status}</p>
                             </div>
                        </div>
                    </div>
                 ))}
            </div>
        </div>
    </div>
  </div>
);

const AdminDashboard = ({ users, onPostAnnouncement }: { users: User[], onPostAnnouncement: () => void }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
          <button onClick={onPostAnnouncement} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Megaphone size={16} /> Post Announcement
          </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Total Employees" value={users.length} sub="+2 this month" icon={Users} color="indigo" />
          <StatCard label="Open Positions" value="3" sub="1 urgent" icon={Briefcase} color="emerald" />
          <StatCard label="On Leave" value="4" sub="Today" icon={Calendar} color="orange" />
          <StatCard label="Happiness" value="94%" sub="+2% vs last month" icon={Heart} color="pink" />
      </div>
  </div>
);

const AdminPeople = ({ users, onAddUser, onSelectUser }: { users: User[], onAddUser: () => void, onSelectUser: (u: User) => void }) => {
    const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Directory</h2>
                <div className="flex gap-2">
                    <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
                        <button onClick={() => setViewMode('List')} className={`p-1.5 rounded ${viewMode === 'List' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><ListIcon size={16}/></button>
                        <button onClick={() => setViewMode('Grid')} className={`p-1.5 rounded ${viewMode === 'Grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}><Grid size={16}/></button>
                    </div>
                    <button onClick={onAddUser} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                        <UserPlus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            {viewMode === 'List' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} onClick={() => onSelectUser(user)} className="hover:bg-slate-50 cursor-pointer">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{user.avatar}</div>
                                        <span className="font-medium text-slate-900">{user.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 capitalize">{user.role}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.department}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : user.status === 'Onboarding' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} onClick={() => onSelectUser(user)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center relative group">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600 mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {user.avatar}
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                            <p className="text-slate-500 text-sm mb-4 capitalize">{user.role} • {user.department}</p>
                            <div className="w-full border-t border-slate-50 pt-4 flex justify-between items-center text-xs text-slate-400">
                                <span className="flex items-center gap-1"><MapPin size={12}/> {user.location}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{user.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminPerformance = ({ cycles, onStartCycle, users, currentUser }: { cycles: PerformanceCycle[], onStartCycle: () => void, users: User[], currentUser: User }) => {
    const [activeTab, setActiveTab] = useState<'Cycles' | 'OneOnOne' | 'Feedback'>('Cycles');
    const directReports = users.filter(u => u.managerId === currentUser.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Performance Management</h2>
                {activeTab === 'Cycles' && (
                    <button onClick={onStartCycle} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                        <Plus size={16} /> New Review Cycle
                    </button>
                )}
            </div>

            <div className="flex gap-6 border-b border-slate-200">
                {['Cycles', 'OneOnOne', 'Feedback'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab === 'OneOnOne' ? 'Team 1:1s' : tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Cycles' && (
                <div className="grid grid-cols-1 gap-6">
                    {cycles.map(cycle => (
                        <div key={cycle.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-900">{cycle.title}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${cycle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{cycle.status}</span>
                                </div>
                                <p className="text-sm text-slate-500">{cycle.period} • Deadline: {cycle.deadline}</p>
                            </div>
                            <div className="flex items-center gap-6 w-1/3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500">Completion</span>
                                        <span className="font-bold text-slate-900">{cycle.completion}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${cycle.completion}%` }}></div>
                                    </div>
                                </div>
                                <button className="text-sm font-medium text-indigo-600 hover:underline">Manage</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'OneOnOne' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-dashed border-2 flex flex-col items-center justify-center text-center h-48 cursor-pointer hover:bg-slate-50">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                <Plus size={24} />
                            </div>
                            <h4 className="font-bold text-slate-900">Schedule 1:1</h4>
                            <p className="text-xs text-slate-500 mt-1">Setup recurring syncs with your team</p>
                        </div>
                        
                        {directReports.length === 0 ? (
                            <div className="col-span-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 italic">
                                You don't have any direct reports yet.
                            </div>
                        ) : (
                            directReports.map(report => (
                                <div key={report.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{report.avatar}</div>
                                            <h4 className="font-bold text-slate-900">{report.name}</h4>
                                        </div>
                                        <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors">History</button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Weekly Sync • Every Tuesday</p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-4 h-4 rounded border border-slate-300"></div> <span>Review {report.role} goals</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-4 h-4 rounded border border-slate-300"></div> <span>Feedback on recent sprint</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-2 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Start Meeting</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'Feedback' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="font-bold text-lg text-slate-900">Continuous Feedback</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">Encourage a culture of feedback. Send or request feedback from peers at any time.</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm">Give Feedback</button>
                        <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm">Request Feedback</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// REFACTORED: AdminSettings with Webhooks
const AdminSettings = ({ onAction }: { onAction: (action: string) => void }) => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><Sliders size={18}/> Company Branding</h3>
                    <p className="text-sm text-slate-500 mt-1">Logo, colors, and themes.</p>
                </div>
                <button onClick={() => onAction('settings-branding')} className="text-indigo-600 font-medium text-sm hover:underline">Edit</button>
            </div>
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><Lock size={18}/> Access Control</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage role permissions and ABAC policies.</p>
                </div>
                <button onClick={() => onAction('settings-permissions')} className="text-indigo-600 font-medium text-sm hover:underline">Edit</button>
            </div>
             <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><Share2 size={18}/> Integrations</h3>
                    <p className="text-sm text-slate-500 mt-1">Slack, Google Workspace, GitHub, Datev.</p>
                </div>
                <button onClick={() => onAction('settings-integrations')} className="text-indigo-600 font-medium text-sm hover:underline">Manage</button>
            </div>
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><Webhook size={18}/> Webhooks & Events</h3>
                    <p className="text-sm text-slate-500 mt-1">Configure outbound events and API keys.</p>
                </div>
                <button onClick={() => onAction('settings-webhooks')} className="text-indigo-600 font-medium text-sm hover:underline">Manage</button>
            </div>
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><BillingIcon size={18}/> Billing & Plans</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage invoices, payment methods and plan upgrades.</p>
                </div>
                <button className="text-indigo-600 font-medium text-sm hover:underline">View</button>
            </div>
             <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                    <h3 className="font-medium text-slate-900 flex items-center gap-2"><BellIcon size={18}/> Notification Settings</h3>
                    <p className="text-sm text-slate-500 mt-1">Configure email and Slack alert preferences.</p>
                </div>
                <button className="text-indigo-600 font-medium text-sm hover:underline">Edit</button>
            </div>
        </div>
    </div>
);

const AdminOrg = ({ users, onReparent, readOnly = false }: { users: User[], onReparent: (childId: string, managerId: string) => void, readOnly?: boolean }) => {
    const [scale, setScale] = useState(1);
    const [movingNodeId, setMovingNodeId] = useState<string | null>(null);
    
    // Recursive node component
    const Node = ({ user }: { user: User }) => {
        const [collapsed, setCollapsed] = useState(false);
        const reports = users.filter(u => u.managerId === user.id);
        const isMoving = movingNodeId === user.id;
        const isTarget = movingNodeId !== null && !isMoving;
        
        return (
            <div className="flex flex-col items-center animate-in fade-in duration-300">
                <div 
                    className={`border transition-all p-4 rounded-xl shadow-sm w-64 mb-8 relative z-10 flex flex-col items-center gap-3 ${
                        isMoving ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 
                        isTarget ? 'border-dashed border-slate-300 bg-slate-50 hover:bg-green-50 hover:border-green-300 cursor-pointer' : 
                        'border-slate-200 bg-white hover:shadow-md'
                    }`}
                    onClick={(e) => {
                        if (isTarget) {
                            e.stopPropagation();
                            onReparent(movingNodeId!, user.id);
                            setMovingNodeId(null);
                        } else {
                            setCollapsed(!collapsed);
                        }
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{user.avatar}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role}</p>
                        </div>
                    </div>

                    {!readOnly && (
                        <div className="w-full pt-2 border-t border-slate-100 flex justify-center">
                            {isMoving ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setMovingNodeId(null); }}
                                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1 rounded-full"
                                >
                                    Cancel Move
                                </button>
                            ) : isTarget ? (
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                    <CornerDownRight size={12}/> Assign Here
                                </span>
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setMovingNodeId(user.id); }}
                                    className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-50"
                                >
                                    <Move size={12}/> Move
                                </button>
                            )}
                        </div>
                    )}

                    {reports.length > 0 && (
                        <>
                            <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-slate-300"></div>
                            <div 
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-100 border border-slate-300 rounded-full w-4 h-4 flex items-center justify-center z-20 cursor-pointer hover:bg-white"
                                onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
                            >
                                {collapsed ? <Plus size={8}/> : <X size={8}/>}
                            </div>
                        </>
                    )}
                </div>
                {reports.length > 0 && !collapsed && (
                    <div className="flex gap-8 relative animate-in fade-in slide-in-from-top-4 duration-300">
                        {reports.length > 1 && (
                            <div className="absolute -top-4 left-0 right-0 h-px bg-slate-300 mx-32"></div>
                        )}
                        {reports.map((report, idx) => (
                            <div key={report.id} className="relative">
                                <div className="absolute -top-4 left-1/2 w-px h-4 bg-slate-300"></div>
                                <Node user={report} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const roots = users.filter(u => !u.managerId);

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Organization Chart</h2>
                    {!readOnly && <p className="text-xs text-slate-500">Click "Move" on a card, then select a new manager to restructure.</p>}
                </div>
                <div className="flex gap-2 bg-slate-200 p-1 rounded-lg">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 bg-white rounded shadow text-slate-600 hover:text-slate-900"><ZoomOut size={16}/></button>
                    <span className="px-2 text-xs font-bold text-slate-500 flex items-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="p-1.5 bg-white rounded shadow text-slate-600 hover:text-slate-900"><ZoomIn size={16}/></button>
                </div>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-auto p-12 flex justify-center relative">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
                    {roots.map(root => <Node key={root.id} user={root} />)}
                </div>
            </div>
        </div>
    );
};

const ITView = ({ page, tickets, assets, users, currentUser, onMoveTicket, onAddAsset, onAssignAsset, onReturnAsset }: any) => {
    if (page === 'dashboard') {
        const openTickets = tickets.filter((t: Request) => t.status !== 'Resolved').length;
        const availableAssets = assets.filter((a: Asset) => a.status === 'Available').length;
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-slate-900">IT Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Open Tickets" value={openTickets} sub="Needs attention" icon={LifeBuoy} color="red" />
                    <StatCard label="Available Assets" value={availableAssets} sub="In stock" icon={Monitor} color="blue" />
                    <StatCard label="Systems Status" value="Operational" sub="99.9% Uptime" icon={Server} color="green" />
                </div>
            </div>
        );
    }
    
    if (page === 'tickets') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3">Requester</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.map((t: Request) => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{t.title}</p>
                                        <p className="text-xs text-slate-500">{t.details}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{t.requester}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'Resolved' ? 'bg-green-100 text-green-700' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {t.status === 'Pending' && <button onClick={() => onMoveTicket(t.id, 'In Progress')} className="text-xs font-medium text-blue-600 hover:underline">Take</button>}
                                        {t.status !== 'Resolved' && <button onClick={() => onMoveTicket(t.id, 'Resolved')} className="text-xs font-medium text-green-600 hover:underline">Resolve</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (page === 'inventory') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Asset Inventory</h2>
                    <button onClick={onAddAsset} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                        <Plus size={16} /> Add Asset
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Device</th>
                                <th className="px-6 py-3">Serial</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Assigned To</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {assets.map((a: Asset) => {
                                 const assignedUser = users.find((u:User) => u.id === a.assignedTo);
                                 return (
                                    <tr key={a.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{a.model} <span className="text-xs font-normal text-slate-500 block">{a.type}</span></td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{a.serialNumber}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{assignedUser ? assignedUser.name : '-'}</td>
                                        <td className="px-6 py-4">
                                            {a.status === 'Available' && (
                                                <button onClick={() => onAssignAsset(a.id)} className="text-xs font-medium text-indigo-600 hover:underline">Assign</button>
                                            )}
                                            {a.status === 'In Use' && (
                                                <button onClick={() => onReturnAsset(a.id)} className="text-xs font-medium text-red-600 hover:underline">Return</button>
                                            )}
                                        </td>
                                    </tr>
                                 );
                             })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    return null;
}

const RecruitingJobs = ({ jobs, onPostJob }: { jobs: Job[], onPostJob: () => void }) => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Open Positions</h2>
          <button onClick={onPostJob} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
            <Plus size={16} /> Post Job
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{job.title}</h3>
                        <p className="text-slate-500 text-sm">{job.department} • {job.location}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-900">{job.applicants}</span>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Applicants</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${job.stage === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {job.stage}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const RecruitingPipeline = ({ candidates, onAddCandidate, onMoveCandidate, onSelectCandidate }: { candidates: Candidate[], onAddCandidate: () => void, onMoveCandidate: (id: string, stage: string) => void, onSelectCandidate: (c: Candidate) => void }) => {
    const stages = ['Applied', 'Screening', 'Interview', 'Offer'];
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary for onDrop to fire
    };

    const handleDrop = (e: React.DragEvent, targetStage: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) {
            onMoveCandidate(id, targetStage);
        }
        setDraggedId(null);
    };
    
    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Candidate Pipeline</h2>
                <button onClick={onAddCandidate} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <UserPlus size={16} /> Add Candidate
                </button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-[1000px] h-full">
                    {stages.map(stage => (
                        <div 
                            key={stage} 
                            className="flex-1 bg-slate-100 rounded-xl p-4 flex flex-col transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="font-semibold text-slate-700">{stage}</h3>
                                 <span className="bg-white text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                     {candidates.filter(c => c.stage === stage).length}
                                 </span>
                             </div>
                             <div className="space-y-3 overflow-y-auto flex-1 min-h-[100px]">
                                 {candidates.filter(c => c.stage === stage).map(c => (
                                     <div 
                                        key={c.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, c.id)}
                                        onClick={() => onSelectCandidate(c)} 
                                        className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group relative active:cursor-grabbing active:rotate-1"
                                     >
                                         {/* Header: Avatar + Name + Source */}
                                         <div className="flex justify-between items-start mb-2">
                                             <div className="flex gap-2 items-center">
                                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                     {c.name.charAt(0)}
                                                 </div>
                                                 <div>
                                                     <h4 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h4>
                                                     <p className="text-[10px] text-slate-400">{c.appliedDate}</p>
                                                 </div>
                                             </div>
                                             {c.source && (
                                                 <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500 font-medium">
                                                     {c.source}
                                                 </span>
                                             )}
                                         </div>

                                         {/* Role */}
                                         <p className="text-xs text-slate-600 mb-3 line-clamp-1">
                                             {c.currentRole ? (
                                                 <>
                                                     <span className="font-medium text-slate-800">{c.currentRole}</span>
                                                     <span className="text-slate-400"> at </span>
                                                     {c.company}
                                                 </>
                                             ) : 'Applicant'}
                                         </p>

                                         {/* Skills & Rating */}
                                         <div className="flex flex-col gap-2">
                                             {c.skills && c.skills.length > 0 && (
                                                 <div className="flex flex-wrap gap-1">
                                                     {c.skills.slice(0, 2).map(skill => (
                                                         <span key={skill} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-medium border border-indigo-100">
                                                             {skill}
                                                         </span>
                                                     ))}
                                                     {c.skills.length > 2 && (
                                                         <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded border border-slate-100">
                                                             +{c.skills.length - 2}
                                                         </span>
                                                     )}
                                                 </div>
                                             )}
                                             
                                             <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                                                  <div className="flex gap-0.5">
                                                      {[1,2,3,4,5].map(star => (
                                                          <Star key={star} size={10} className={star <= c.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                                      ))}
                                                  </div>
                                                  {c.rating > 0 && <span className="text-[10px] font-bold text-slate-400">{c.rating}.0</span>}
                                             </div>
                                         </div>
                                         
                                         {/* Fallback Move Controls */}
                                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-md border border-slate-100 flex z-10">
                                            {stages.indexOf(stage) > 0 && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onMoveCandidate(c.id, stages[stages.indexOf(stage) - 1]) }}
                                                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 border-r border-slate-100" title="Move Back"
                                                >
                                                    <ChevronRight size={14} className="rotate-180" />
                                                </button>
                                            )}
                                             {stages.indexOf(stage) < stages.length - 1 && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onMoveCandidate(c.id, stages[stages.indexOf(stage) + 1]) }}
                                                    className="p-1.5 hover:bg-slate-50 text-emerald-600 hover:text-emerald-700" title="Move Forward"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                             )}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Updated: Active Sourcing in Talent Pool
const RecruitingPool = ({ candidates, onImportCandidate }: { candidates: Candidate[], onImportCandidate: (profile: ExternalProfile) => void }) => {
  const [activeTab, setActiveTab] = useState<'Pool' | 'Sourcing'>('Pool');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalProfile[]>([]);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSearching(true);
      // Simulate API latency
      setTimeout(() => {
          setSearchResults(MOCK_SOURCING_RESULTS);
          setIsSearching(false);
      }, 1000);
  };

  return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold text-slate-900">Talent Acquisition</h2>
             <div className="flex bg-slate-200 p-1 rounded-lg">
                 <button 
                    onClick={() => setActiveTab('Pool')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'Pool' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                 >
                     Internal Pool
                 </button>
                 <button 
                    onClick={() => setActiveTab('Sourcing')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'Sourcing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                 >
                     Active Sourcing
                 </button>
             </div>
        </div>

        {activeTab === 'Pool' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Existing Pool Table code... */}
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Candidate</th>
                        <th className="px-6 py-3">Skills</th>
                        <th className="px-6 py-3">Source</th>
                        <th className="px-6 py-3">Referrer</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {candidates.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                            <td className="px-6 py-4 text-slate-600">
                            {c.skills.map(s => (
                                <span key={s} className="px-2 py-1 bg-slate-100 rounded text-xs mr-1">{s}</span>
                            ))}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${c.source === 'Referral' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{c.source || 'Direct'}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{c.referrer || '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'Sourcing' && (
            <div className="space-y-6">
                 {/* Search Bar */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <form onSubmit={handleSearch} className="flex gap-4 items-end">
                         <div className="flex-1">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                             <div className="relative">
                                 <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                 <input type="text" placeholder="e.g. React, Engineer, Berlin" className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                             </div>
                         </div>
                         <div className="w-48">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                              <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900">
                                  <option>All Sources</option>
                                  <option>LinkedIn</option>
                                  <option>GitHub</option>
                                  <option>Xing</option>
                              </select>
                         </div>
                         <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                             {isSearching ? 'Crawling...' : 'Find Candidates'}
                         </button>
                     </form>
                 </div>

                 {/* Results */}
                 {searchResults.length > 0 && (
                     <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Matches ({searchResults.length})</h3>
                         {searchResults.map(profile => {
                             const isImported = candidates.some(c => c.name === profile.name);
                             return (
                                <div key={profile.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                     <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">{profile.avatar}</div>
                                         <div>
                                             <div className="flex items-center gap-2">
                                                 <h4 className="font-bold text-slate-900 text-lg">{profile.name}</h4>
                                                 <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">{profile.source}</span>
                                             </div>
                                             <p className="text-slate-600 text-sm">{profile.currentRole} at {profile.company} • {profile.location}</p>
                                             <div className="flex gap-2 mt-2">
                                                 {profile.skills.map(s => (
                                                     <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-md border border-slate-100">{s}</span>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex flex-col items-end gap-3">
                                         <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
                                             <Zap size={14} className="fill-green-700"/> {profile.matchScore}% Match
                                         </div>
                                         {isImported ? (
                                              <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium border border-slate-200 cursor-not-allowed flex items-center gap-2">
                                                  <CheckCircle size={16}/> Imported
                                              </button>
                                         ) : (
                                              <button onClick={() => onImportCandidate(profile)} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                                  <UserPlus size={16}/> Import to Pipeline
                                              </button>
                                         )}
                                     </div>
                                </div>
                             );
                         })}
                     </div>
                 )}
            </div>
        )}
      </div>
  );
};

const RecruitingDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-slate-900">Recruiting Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Active Jobs" value="3" sub="2 Published" icon={Briefcase} color="indigo" />
            <StatCard label="Candidates" value="12" sub="+4 this week" icon={Users} color="emerald" />
            <StatCard label="Interviews" value="5" sub="Scheduled" icon={Calendar} color="purple" />
            <StatCard label="Time to Hire" value="24d" sub="-2d avg" icon={Clock} color="orange" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">Pipeline Health</h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-600">Screening</span>
                             <span className="font-bold">4 Candidates</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-600">Interview</span>
                             <span className="font-bold">2 Candidates</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                         </div>
                     </div>
                 </div>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">Upcoming Interviews</h3>
                 <div className="space-y-3">
                     <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                             14:00
                         </div>
                         <div>
                             <p className="text-sm font-bold text-slate-900">Felix Kjellberg</p>
                             <p className="text-xs text-slate-500">Frontend Engineer • Technical</p>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    </div>
);

const CareerPageEditor = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Career Page Editor</h2>
            <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-50">
                <GlobeIcon size={16}/> View Live
            </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex h-[600px]">
            <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Sections</h4>
                <div className="space-y-2">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm cursor-move">Hero Banner</div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm cursor-move">About Us</div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm cursor-move">Benefits</div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm cursor-move">Open Roles</div>
                </div>
            </div>
            <div className="flex-1 bg-white p-8 overflow-y-auto">
                <div className="border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400">
                    <Layout size={48} className="mb-4 opacity-20"/>
                    <p>Drag and drop sections here to build your career page.</p>
                </div>
            </div>
        </div>
    </div>
);

const AdminView = ({ page, users, currentUser, requests, payrollEntries, cycles, onAddUser, onPostAnnouncement, onSelectUser, onReparent, onRequestAction, onUpdatePayroll, onRunPayroll, onAction }: any) => {
    switch(page) {
        case 'dashboard': return <AdminDashboard users={users} onPostAnnouncement={onPostAnnouncement} />;
        case 'inbox': return <AdminInbox requests={requests} onApprove={(id: string) => onRequestAction(id, 'Approved')} onReject={(id: string) => onRequestAction(id, 'Rejected')} />;
        case 'people': return <AdminPeople users={users} onAddUser={onAddUser} onSelectUser={onSelectUser} />;
        case 'performance': return <AdminPerformance cycles={cycles} onStartCycle={() => onAction('performance-cycle')} users={users} currentUser={currentUser} />;
        case 'payroll': return <AdminPayroll users={users} entries={payrollEntries} onUpdateEntry={onUpdatePayroll} onRunPayroll={onRunPayroll} />;
        case 'org': return <AdminOrg users={users} onReparent={onReparent} />;
        case 'settings': return <AdminSettings onAction={onAction} />;
        default: return <AdminDashboard users={users} onPostAnnouncement={onPostAnnouncement} />;
    }
};

const RecruitingView = ({ page, jobs, candidates, onPostJob, onAddCandidate, onMoveCandidate, onSelectCandidate, onImportCandidate }: any) => {
    switch(page) {
        case 'dashboard': return <RecruitingDashboard />;
        case 'jobs': return <RecruitingJobs jobs={jobs} onPostJob={onPostJob} />;
        case 'candidates': return <RecruitingPipeline candidates={candidates} onAddCandidate={onAddCandidate} onMoveCandidate={onMoveCandidate} onSelectCandidate={onSelectCandidate} />;
        case 'pool': return <RecruitingPool candidates={candidates} onImportCandidate={onImportCandidate} />;
        case 'career-page': return <CareerPageEditor />;
        default: return <RecruitingDashboard />;
    }
};

const HubView = ({ page, currentUser, users, posts, goals, skills, groups, groupPosts, events, timeEntries, onAction, onAddGoal, onSelectCoworker, onJoinGroup, onSelectGroup, activeGroup, onBackFromGroup }: any) => {
    const today = new Date().toISOString().split('T')[0];
    const isClockedIn = timeEntries ? !!timeEntries.find((t: any) => t.date === today && !t.out) : false;

    // Handle deep link to Community Detail
    if (page === 'community' && activeGroup) {
        return <HubGroupDetail group={activeGroup} posts={groupPosts} users={users} events={events} onBack={onBackFromGroup} currentUser={currentUser} onCreateEvent={() => onAction('create-event')} />;
    }

    switch(page) {
        case 'dashboard': return <HubDashboard currentUser={currentUser} onAction={onAction} isClockedIn={isClockedIn} onToggleClock={() => onAction('clock')} posts={posts} events={events} />;
        case 'time': return <HubTime onAction={onAction} timeEntries={timeEntries} />;
        case 'profile': return <HubProfile currentUser={currentUser} onEdit={() => onAction('profile-edit')} />;
        case 'grow': return <HubGrow goals={goals} skills={skills} onAddGoal={onAddGoal} />; // Explicitly passing onAddGoal
        case 'community': return <HubCommunity groups={groups} events={events} onJoinGroup={onJoinGroup} onSelectGroup={onSelectGroup} onCreateEvent={() => onAction('create-event')} />;
        case 'directory': return <HubDirectory users={users} onSelectUser={onSelectCoworker} />; // Explicitly passing onSelectCoworker
        case 'docs': return <HubDocs />;
        case 'org': return <AdminOrg users={users} onReparent={() => {}} readOnly={true} />;
        default: return <HubDashboard currentUser={currentUser} onAction={onAction} isClockedIn={isClockedIn} onToggleClock={() => onAction('clock')} posts={posts} events={events} />;
    }
};

// --- APP SHELL --- 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[2]); 
  const [currentApp, setCurrentApp] = useState<'hub' | 'admin' | 'recruiting' | 'it'>('admin');
  const [activePage, setActivePage] = useState('payroll');
  
  // Data State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>(INITIAL_GROUP_POSTS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [cycles, setCycles] = useState<PerformanceCycle[]>(INITIAL_CYCLES);
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(INITIAL_TIME_ENTRIES);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>(INITIAL_PAYROLL);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  
  // Selections
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [coworkerDetails, setCoworkerDetails] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null); 
  
  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // ... (Effects and Handlers same as before) ...
  useEffect(() => {
    if (currentApp === 'hub') setActivePage('dashboard');
    if (currentApp === 'recruiting') setActivePage('dashboard');
    if (currentApp === 'it') setActivePage('dashboard');
  }, [currentApp]);

  const handleAction = (action: string) => {
      if (action === 'clock') {
          // Clock logic
          const today = new Date().toISOString().split('T')[0];
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const existingEntry = timeEntries.find(t => t.date === today && !t.out);
          if (existingEntry) {
              setTimeEntries(timeEntries.map(t => t.id === existingEntry.id ? { ...t, out: now, duration: '8h 05m' } : t));
              showToast("Clocked Out at " + now);
          } else {
              const newEntry: TimeEntry = { id: Date.now().toString(), date: today, in: now, out: null };
              setTimeEntries([newEntry, ...timeEntries]);
              showToast("Clocked In at " + now);
          }
      } else if (action === 'profile-edit') {
          setActiveModal('profile-edit');
      } else {
          setActiveModal(action);
      }
  };

  const handleCloseModal = () => {
      setActiveModal(null);
      setSelectedCandidate(null);
      setSelectedUser(null);
      setSelectedAssetId(null);
      setCoworkerDetails(null);
      setActiveTab('Overview'); 
  };
  
  const showToast = (msg: string) => setToastMessage(msg);

  const handleRequestAction = (id: string, status: any) => {
      const request = requests.find(r => r.id === id);
      if (status === 'Approved' && request?.type === 'profile' && request.payload && request.requesterId) {
          setUsers(users.map(u => u.id === request.requesterId ? { ...u, ...request.payload } : u));
          if (currentUser.id === request.requesterId) setCurrentUser({ ...currentUser, ...request.payload });
          showToast(`Profile changes applied for ${request.requester}`);
      } else {
          showToast(`Request marked as ${status}`);
      }
      setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleMoveCandidate = (id: string, stage: string) => {
      setCandidates(candidates.map(c => c.id === id ? { ...c, stage: stage as any } : c));
  };

  const handleReparentUser = (childId: string, newManagerId: string) => {
      if (childId === newManagerId) return; 
      const childUser = users.find(u => u.id === childId);
      const newManager = users.find(u => u.id === newManagerId);
      setUsers(users.map(u => u.id === childId ? { ...u, managerId: newManagerId } : u));
      showToast(`Moved ${childUser?.name} to report to ${newManager?.name}`);
  };

  const handleSelectCandidate = (c: Candidate) => {
      setSelectedCandidate(c);
      setActiveTab('Overview');
      setActiveModal('candidate-details');
  };

  const handleSelectUser = (u: User) => {
      setSelectedUser(u);
      setActiveTab('Overview');
      setActiveModal('user-details');
  };

  const handleSelectCoworker = (u: User) => {
      setCoworkerDetails(u);
      setActiveModal('coworker-details');
  };

  const handleUpdatePayroll = (userId: string, bonus: number, deductions: number) => {
      setPayrollEntries(payrollEntries.map(e => e.userId === userId ? { ...e, bonus, deductions } : e));
      showToast("Payroll entry updated");
  };

  const handleRunPayroll = () => {
      setPayrollEntries(payrollEntries.map(e => ({ ...e, status: 'Paid' })));
      showToast("Payroll Run Completed Successfully!");
  };

  const handleMoveTicket = (id: string, newStatus: string) => {
      setRequests(requests.map(r => {
          if (r.id === id) {
              return { ...r, status: newStatus as Request['status'], assigneeId: newStatus === 'In Progress' && !r.assigneeId ? currentUser.id : (newStatus === 'Pending' ? undefined : r.assigneeId) };
          }
          return r;
      }));
      showToast(`Ticket moved to ${newStatus}`);
  };

  const handleAssetAssignStart = (assetId: string) => {
      setSelectedAssetId(assetId);
      setActiveModal('assign-asset');
  };

  const handleAssetReturn = (assetId: string) => {
      setAssets(assets.map(a => a.id === assetId ? { ...a, status: 'Available', assignedTo: undefined } : a));
      showToast("Asset returned to Inventory");
  };

  const handleJoinGroup = (groupId: string) => {
      setGroups(groups.map(g => g.id === groupId ? { ...g, isMember: !g.isMember, members: g.isMember ? g.members - 1 : g.members + 1 } : g));
      showToast("Group membership updated");
  };

  const handleImportCandidate = (profile: ExternalProfile) => {
      const newCandidate: Candidate = {
          id: Date.now().toString(), jobId: 'j1', name: profile.name, stage: 'Applied', rating: 0,
          email: `${profile.name.toLowerCase().replace(' ', '.')}@example.com`, phone: '', appliedDate: 'Sourced just now',
          skills: profile.skills, source: profile.source, currentRole: profile.currentRole, company: profile.company
      };
      setCandidates([...candidates, newCandidate]);
      showToast(`${profile.name} imported to pipeline!`);
  };

  const handleSubmit = (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setActiveModal(null);
    showToast(`${type} submitted successfully!`);
    const form = e.target as any;

    if (type === "Announcement") {
        setPosts([{ id: Date.now().toString(), author: currentUser.name, date: 'Just now', content: form.elements.content.value, type: 'news' }, ...posts]);
    }
    if (type === "Shoutout") {
        setPosts([{ id: Date.now().toString(), author: currentUser.name, date: 'Just now', content: `Big shoutout to @${form.elements.recipient.value}: ${form.elements.message.value}`, type: 'shoutout' }, ...posts]);
    }
    if (type === "Leave Request") {
        setRequests([{ id: Date.now().toString(), type: 'leave', requester: currentUser.name, title: form.elements.type.value, details: `${form.elements.startDate.value} to ${form.elements.endDate.value}`, status: 'Pending', date: 'Just now' }, ...requests]);
    }
    if (type === "Expense Report") {
        setRequests([{ id: Date.now().toString(), type: 'expense', requester: currentUser.name, title: 'Expense Reimbursement', details: 'Misc Expense', amount: form.elements.amount.value, status: 'Pending', date: 'Just now' }, ...requests]);
    }
    if (type === "Ticket") {
        setRequests([{ id: Date.now().toString(), type: 'ticket', requester: currentUser.name, title: 'IT Support Ticket', details: form.elements.desc.value, status: 'Pending', date: 'Just now' }, ...requests]);
    }
    if (type === "Profile Change") {
        const payload = { address: form.elements.address.value, phone: form.elements.phone.value, iban: form.elements.iban.value, emergencyContact: form.elements.emergency.value };
        setRequests([{ id: Date.now().toString(), type: 'profile', requester: currentUser.name, requesterId: currentUser.id, title: 'Update Personal Data', details: `Address: ${payload.address}`, status: 'Pending', date: 'Just now', payload }, ...requests]);
    }
    if (type === "Referral") {
        setCandidates([...candidates, { id: Date.now().toString(), jobId: 'j1', name: form.elements.name.value, stage: 'Applied', rating: 0, email: 'referral@example.com', phone: '', appliedDate: 'Just now', skills: [], source: 'Referral', referrer: currentUser.name }]);
    }
    if (type === "New Employee") {
        const name = form.elements.name.value;
        setUsers([...users, { id: Date.now().toString(), name, role: form.elements.role.value, avatar: name[0].toUpperCase(), department: form.elements.department.value, location: 'Berlin', status: 'Onboarding', managerId: null, email: form.elements.email.value, phone: '', startDate: form.elements.startDate.value, contractType: 'Full-Time', vacationEntitlement: 30, vacationUsed: 0, sickDays: 0, address: '', emergencyContact: '', iban: '' }]);
    }
    if (type === "New Job") setJobs([...jobs, { id: Date.now().toString(), title: form.elements.title.value, department: 'Engineering', location: 'Berlin', applicants: 0, stage: 'Draft' }]);
    if (type === "New Goal") setGoals([...goals, { id: Date.now().toString(), title: form.elements.title.value, progress: 0, status: 'On Track', dueDate: 'Set Date' }]);
    if (type === "New Candidate") setCandidates([...candidates, { id: Date.now().toString(), jobId: 'j1', name: form.elements.name.value, stage: 'Applied', rating: 0, email: 'test@example.com', phone: '', appliedDate: 'Just now', skills: [] }]);
    if (type === "New Asset") setAssets([...assets, { id: Date.now().toString(), type: form.elements.assetType.value, model: form.elements.model.value, serialNumber: form.elements.serialNumber.value, status: form.elements.status.value, purchaseDate: form.elements.purchaseDate.value }]);
    if (type === "Assign Asset" && selectedAssetId) setAssets(assets.map(a => a.id === selectedAssetId ? { ...a, status: 'In Use', assignedTo: form.elements.userId.value } : a));
    if (type === "New Event") setEvents([...events, { id: Date.now().toString(), title: form.elements.title.value, date: form.elements.date.value, time: form.elements.time.value, location: form.elements.location.value, type: form.elements.type.value }]);
    if (type === "Performance Cycle") setCycles([{ id: Date.now().toString(), title: form.elements.title.value, period: 'Upcoming', status: 'Draft', completion: 0, deadline: 'TBD' }, ...cycles]);
    if (type === "Update Webhooks") showToast("Webhook configuration saved!");
  };

  const navItems = useMemo(() => {
    if (currentApp === 'hub') return [ { id: 'dashboard', label: 'Home', icon: Home }, { id: 'profile', label: 'My Profile', icon: Users }, { id: 'grow', label: 'Grow & Goals', icon: Target }, { id: 'community', label: 'Community', icon: Heart }, { id: 'directory', label: 'Directory', icon: Users }, { id: 'time', label: 'Time & Absence', icon: Calendar }, { id: 'org', label: 'Org Chart', icon: MapPin }, { id: 'docs', label: 'Documents', icon: FileText } ];
    if (currentApp === 'admin') return [ { id: 'dashboard', label: 'Dashboard', icon: Layout }, { id: 'inbox', label: 'Inbox', icon: Inbox }, { id: 'people', label: 'People', icon: Users }, { id: 'performance', label: 'Performance', icon: TrendingUp }, { id: 'payroll', label: 'Payroll', icon: DollarSign }, { id: 'org', label: 'Org Chart', icon: MapPin }, { id: 'settings', label: 'Settings', icon: Settings } ];
    if (currentApp === 'it') return [ { id: 'dashboard', label: 'Dashboard', icon: Layout }, { id: 'tickets', label: 'Tickets', icon: LifeBuoy }, { id: 'inventory', label: 'Inventory', icon: Monitor } ];
    return [ { id: 'dashboard', label: 'Overview', icon: Layout }, { id: 'jobs', label: 'Jobs', icon: Briefcase }, { id: 'candidates', label: 'Pipeline', icon: GitBranch }, { id: 'pool', label: 'Talent Pool', icon: Users }, { id: 'career-page', label: 'Career Page', icon: Building } ];
  }, [currentApp]);

  if (!isAuthenticated) {
      return <AuthView onLogin={(isAdmin) => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-2 border-b border-slate-50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">HR</div>
          <span className="font-bold text-lg tracking-tight">Suite.io</span>
        </div>
        <div className="px-4 py-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Workspace</label>
          <div className="flex flex-col gap-1">
            <button onClick={() => setCurrentApp('hub')} className={`text-left px-3 py-2 rounded-md text-sm ${currentApp === 'hub' ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Hub (Employee)</button>
            {(currentUser.role === 'hr' || currentUser.role === 'manager') && <button onClick={() => setCurrentApp('admin')} className={`text-left px-3 py-2 rounded-md text-sm ${currentApp === 'admin' ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Admin (HR)</button>}
            {(currentUser.role === 'hr' || currentUser.role === 'recruiter') && <button onClick={() => setCurrentApp('recruiting')} className={`text-left px-3 py-2 rounded-md text-sm ${currentApp === 'recruiting' ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Recruiting</button>}
            {(currentUser.role === 'hr' || currentUser.role === 'it_admin') && <button onClick={() => setCurrentApp('it')} className={`text-left px-3 py-2 rounded-md text-sm ${currentApp === 'it' ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>IT Console</button>}
          </div>
        </div>
        <nav className="flex-1 px-2 space-y-1">
           <label className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2 block">Menu</label>
           {navItems.map(item => (<NavItem key={item.id} icon={item.icon} label={item.label} active={activePage === item.id} onClick={() => { setActivePage(item.id); setActiveGroup(null); }} />))}
        </nav>
        <div className="p-4 border-t border-slate-200">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">{currentUser.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
              </div>
           </div>
           <div className="border-t border-slate-100 pt-2 mt-2">
             <button onClick={() => setIsAuthenticated(false)} className="w-full text-left px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-2">
                <LogOut size={14} /> Log Out
             </button>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto p-8 h-full">
          {currentApp === 'hub' && <HubView page={activePage} currentUser={currentUser} users={users} posts={posts} goals={goals} skills={skills} groups={groups} groupPosts={groupPosts} events={events} timeEntries={timeEntries} onAction={handleAction} onAddGoal={() => setActiveModal('goal')} onSelectCoworker={handleSelectCoworker} onJoinGroup={handleJoinGroup} onSelectGroup={setActiveGroup} activeGroup={activeGroup} onBackFromGroup={() => setActiveGroup(null)} />}
          {currentApp === 'admin' && <AdminView page={activePage} currentUser={currentUser} users={users} requests={requests} payrollEntries={payrollEntries} cycles={cycles} onAddUser={() => setActiveModal('employee')} onPostAnnouncement={() => setActiveModal('announcement')} onSelectUser={handleSelectUser} onReparent={handleReparentUser} onRequestAction={handleRequestAction} onUpdatePayroll={handleUpdatePayroll} onRunPayroll={handleRunPayroll} onAction={handleAction} />}
          {currentApp === 'it' && <ITView page={activePage} tickets={requests.filter((r:Request) => r.type === 'ticket')} assets={assets} users={users} currentUser={currentUser} onMoveTicket={handleMoveTicket} onAddAsset={() => setActiveModal('asset')} onAssignAsset={handleAssetAssignStart} onReturnAsset={handleAssetReturn} />}
          {currentApp === 'recruiting' && <RecruitingView page={activePage} jobs={jobs} candidates={candidates} onPostJob={() => setActiveModal('job')} onAddCandidate={() => setActiveModal('candidate')} onMoveCandidate={handleMoveCandidate} onSelectCandidate={handleSelectCandidate} onImportCandidate={handleImportCandidate} />}
        </div>
        
        {/* Floating Assistant Button */}
        <button 
            onClick={() => setIsAssistantOpen(!isAssistantOpen)} 
            className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-40 hover:scale-110"
        >
            <Sparkles size={24} className={isAssistantOpen ? "fill-white" : ""}/>
        </button>
        <SmartAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      </main>

       {/* --- MODALS --- */}
       <Modal isOpen={activeModal === 'create-event'} onClose={handleCloseModal} title="Create Event">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Event")}>
            <input name="title" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Event Title" required/>
            <div className="grid grid-cols-2 gap-4">
                <input name="date" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
                <input name="time" type="text" placeholder="14:00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input name="location" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Location" required/>
                <select name="type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option>Company</option><option>Social</option></select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Create</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'performance-cycle'} onClose={handleCloseModal} title="Start Performance Cycle">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Performance Cycle")}>
            <input name="title" type="text" placeholder="Cycle Name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Start</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'settings-branding'} onClose={handleCloseModal} title="Branding Settings">
           <div className="p-6 space-y-6">
               <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">Upload</div>
               <div className="flex gap-2"><div className="w-8 h-8 rounded-full bg-indigo-600"></div><div className="w-8 h-8 rounded-full bg-emerald-600"></div></div>
               <div className="flex justify-end"><button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg">Save</button></div>
           </div>
       </Modal>

       <Modal isOpen={activeModal === 'settings-permissions'} onClose={handleCloseModal} title="Permissions">
           <div className="p-6 space-y-2">{['View Salaries', 'Edit Employees', 'Approve Leaves'].map(p => (<div key={p} className="flex justify-between p-3 bg-slate-50 border rounded-lg text-sm">{p} <span>Enabled</span></div>))}</div>
       </Modal>

       <Modal isOpen={activeModal === 'settings-integrations'} onClose={handleCloseModal} title="Integrations">
           <div className="p-6 space-y-4">
               <div className="flex justify-between p-4 border rounded-lg items-center"><div className="flex gap-3 items-center"><div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center">N</div><span className="font-bold text-sm">Notion</span></div><span className="text-xs text-green-600">Connected</span></div>
               <div className="flex justify-between p-4 border rounded-lg items-center"><div className="flex gap-3 items-center"><div className="w-8 h-8 bg-green-600 text-white rounded flex items-center justify-center">S</div><span className="font-bold text-sm">Slack</span></div><button className="text-xs text-indigo-600">Connect</button></div>
           </div>
       </Modal>

       <Modal isOpen={activeModal === 'settings-webhooks'} onClose={handleCloseModal} title="Webhooks Configuration">
           <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Update Webhooks")}>
               <div className="space-y-4">
                   <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                       <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">Endpoint URL</span>
                           <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                       </div>
                       <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono text-slate-600 bg-white" defaultValue="https://api.internal.company.com/webhooks/hr" />
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subscribed Events</label>
                       <div className="space-y-2">
                           {['user.created', 'user.updated', 'absence.approved', 'job.application.created'].map(evt => (
                               <label key={evt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                   <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                                   {evt}
                               </label>
                           ))}
                       </div>
                   </div>
                   
                   <div className="pt-2 border-t border-slate-200">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Signing Secret</label>
                       <div className="flex gap-2">
                           <input type="password" value="whsec_xxxxx" disabled className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                           <button type="button" className="px-3 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"><Copy size={16}/></button>
                       </div>
                   </div>
               </div>
               <div className="flex justify-end gap-2 pt-2">
                   <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                   <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Configuration</button>
               </div>
           </form>
       </Modal>
       
       <Modal isOpen={activeModal === 'candidate-details'} onClose={handleCloseModal} title="Candidate Profile" size="xl">
         {selectedCandidate && (
             <div className="p-6 space-y-6">
                 <div className="flex justify-between">
                     <div><h2 className="text-xl font-bold">{selectedCandidate.name}</h2><p className="text-slate-500">{selectedCandidate.currentRole}</p></div>
                     <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold h-fit">{selectedCandidate.stage}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2 text-sm"><p><strong>Email:</strong> {selectedCandidate.email}</p><p><strong>Source:</strong> {selectedCandidate.source}</p></div>
                     <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm italic">"{selectedCandidate.notes || 'No notes yet.'}"</p></div>
                 </div>
                 <div className="flex justify-end gap-2"><button className="px-4 py-2 border rounded-lg text-sm">Reject</button><button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">Advance</button></div>
             </div>
         )}
       </Modal>
       
       <Modal isOpen={activeModal === 'shoutout'} onClose={handleCloseModal} title="Send Shoutout">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Shoutout")}>
            <select name="recipient" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900">{users.filter(u => u.id !== currentUser.id).map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}</select>
            <textarea name="message" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 bg-white text-slate-900" placeholder="Message..." required></textarea>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg">Send</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'user-details'} onClose={handleCloseModal} title="Employee Master Data" size="lg">
         {selectedUser && (
             <div className="p-6">
                 <div className="flex gap-4 mb-6"><div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-bold">{selectedUser.avatar}</div><div><h2 className="text-xl font-bold">{selectedUser.name}</h2><p className="text-slate-500">{selectedUser.role}</p></div></div>
                 <div className="space-y-4">
                     <div><label className="block text-xs text-slate-500">Email</label><p className="text-sm font-medium">{selectedUser.email}</p></div>
                     <div><label className="block text-xs text-slate-500">Department</label><p className="text-sm font-medium">{selectedUser.department}</p></div>
                     <div><label className="block text-xs text-slate-500">Location</label><p className="text-sm font-medium">{selectedUser.location}</p></div>
                 </div>
             </div>
         )}
       </Modal>

       <Modal isOpen={activeModal === 'coworker-details'} onClose={handleCloseModal} title="Contact Card" size="md">
         {coworkerDetails && (
             <div className="p-6 text-center">
                 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">{coworkerDetails.avatar}</div>
                 <h2 className="text-xl font-bold">{coworkerDetails.name}</h2>
                 <p className="text-slate-500 mb-6">{coworkerDetails.role} • {coworkerDetails.department}</p>
                 <div className="space-y-3 text-left">
                     <div className="flex gap-3 text-sm text-slate-600"><Mail size={16}/><p>{coworkerDetails.email}</p></div>
                     <div className="flex gap-3 text-sm text-slate-600"><Phone size={16}/><p>{coworkerDetails.phone || 'No phone'}</p></div>
                 </div>
                 <button onClick={() => { handleCloseModal(); setActiveModal('shoutout'); }} className="mt-6 w-full py-2 border rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"><Heart size={16}/> Give Shoutout</button>
             </div>
         )}
       </Modal>
       
       <Modal isOpen={activeModal === 'profile-edit'} onClose={handleCloseModal} title="Request Profile Changes">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Profile Change")}>
            <input name="phone" type="text" defaultValue={currentUser.phone} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Phone"/>
            <input name="address" type="text" defaultValue={currentUser.address} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Address"/>
            <div className="grid grid-cols-2 gap-4">
                <input name="iban" type="text" defaultValue={currentUser.iban} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="IBAN"/>
                <input name="emergency" type="text" defaultValue={currentUser.emergencyContact} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Emergency Contact"/>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Submit Request</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'announcement'} onClose={handleCloseModal} title="Post Announcement">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Announcement")}>
            <textarea name="content" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 bg-white text-slate-900" placeholder="What's happening?" required></textarea>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Post</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'employee'} onClose={handleCloseModal} title="Add Employee">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Employee")}>
            <div className="grid grid-cols-2 gap-4">
                <input name="name" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Name" required/>
                <input name="email" type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Email" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <select name="role" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select>
                <select name="department" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option>Engineering</option><option>Product</option><option>People</option></select>
            </div>
            <input name="startDate" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg">Invite</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'job'} onClose={handleCloseModal} title="Post New Job">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Job")}>
            <input name="title" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Job Title" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Publish</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'goal'} onClose={handleCloseModal} title="Set New Goal">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Goal")}>
            <input name="title" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Goal Title" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Set Goal</button>
            </div>
         </form>
       </Modal>

       <Modal isOpen={activeModal === 'candidate'} onClose={handleCloseModal} title="Add Candidate">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Candidate")}>
            <input name="name" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Candidate Name" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Add</button>
            </div>
         </form>
       </Modal>

      <Modal isOpen={activeModal === 'leave'} onClose={handleCloseModal} title="Request Leave">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Leave Request")}>
            <select name="type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option>Vacation</option><option>Sick Leave</option></select>
            <div className="grid grid-cols-2 gap-4">
               <input name="startDate" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
               <input name="endDate" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Submit</button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={activeModal === 'expense'} onClose={handleCloseModal} title="Submit Expense">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Expense Report")}>
            <input name="amount" type="number" step="0.01" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Amount" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Submit</button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={activeModal === 'referral'} onClose={handleCloseModal} title="Refer a Friend">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Referral")}>
            <input name="name" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Candidate Name" required/>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Submit</button>
            </div>
         </form>
      </Modal>

       <Modal isOpen={activeModal === 'ticket'} onClose={handleCloseModal} title="Create IT Ticket">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Ticket")}>
            <textarea name="desc" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 bg-white text-slate-900" placeholder="Describe the issue..." required></textarea>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Create</button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={activeModal === 'asset'} onClose={handleCloseModal} title="Add New Asset">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "New Asset")}>
            <div className="grid grid-cols-2 gap-4">
                <select name="assetType" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option>Laptop</option><option>Monitor</option><option>Phone</option></select>
                <select name="status" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"><option>Available</option><option>In Use</option><option>Repair</option></select>
            </div>
            <input name="model" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Model" required/>
            <div className="grid grid-cols-2 gap-4">
                <input name="serialNumber" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" placeholder="Serial" required/>
                <input name="purchaseDate" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Add</button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={activeModal === 'assign-asset'} onClose={handleCloseModal} title="Assign Asset">
         <form className="p-6 space-y-4" onSubmit={(e) => handleSubmit(e, "Assign Asset")}>
            <select name="userId" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900" required>
                  <option value="">Select Employee</option>
                  {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Assign</button>
            </div>
         </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}