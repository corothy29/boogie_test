import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Home, Receipt, Settings, Bell, User, Search, AlertCircle, CheckCircle2, ChevronDown, CreditCard, Building2, Wallet, Filter
} from 'lucide-react';

// --- 더미 데이터 ---
const cashFlowData = [
  { month: '1월', 수입: 4500, 지출: 3200, 잔액: 12000 },
  { month: '2월', 수입: 5200, 지출: 3800, 잔액: 13400 },
  { month: '3월', 수입: 4800, 지출: 6500, 잔액: 11700 },
  { month: '4월', 수입: 6100, 지출: 4200, 잔액: 13600 },
  { month: '5월', 수입: 5900, 지출: 4800, 잔액: 14700 },
  { month: '6월', 수입: 2000, 지출: 1500, 잔액: 15200 }, // 현재 달
];

const initialTransactions = [
  { id: 1, date: '2026-06-10 14:30', merchant: '토스페이먼츠(주)', type: 'in', amount: 2500000, aiTag: '매출', confidence: 0.98, status: 'AI 분류 완료' },
  { id: 2, date: '2026-06-09 10:15', merchant: '구글클라우드', type: 'out', amount: 420000, aiTag: '지급수수료', confidence: 0.95, status: 'AI 분류 완료' },
  { id: 3, date: '2026-06-08 19:30', merchant: '배달의민족', type: 'out', amount: 68000, aiTag: '복리후생비', confidence: 0.65, status: '확인 필요' },
  { id: 4, date: '2026-06-08 14:00', merchant: '국세청(법인세)', type: 'out', amount: 3500000, aiTag: '세금과공과', confidence: 0.99, status: 'AI 분류 완료' },
  { id: 5, date: '2026-06-07 11:20', merchant: '쿠팡(주)', type: 'out', amount: 125000, aiTag: '소모품비', confidence: 0.55, status: '확인 필요' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState(initialTransactions);

  // 화폐 포맷터
  const formatCurrency = (value) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);

  // --- 컴포넌트: 네비게이션(LNB) ---
  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Wallet size={20} className="text-white" />
        </div>
        Boogie
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}
        >
          <Home size={20} /> 대시보드
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'transactions' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}
        >
          <Receipt size={20} /> 거래 내역
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'integrations' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}
        >
          <Settings size={20} /> 연동 및 설정
        </button>
      </nav>
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">김대표</p>
            <p className="text-slate-400 text-xs">스타트업(주)</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- 컴포넌트: 상단바(GNB) ---
  const Topbar = () => (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeTab === 'dashboard' && '재무 대시보드'}
        {activeTab === 'transactions' && 'AI 거래 내역'}
        {activeTab === 'integrations' && '연동 및 설정'}
      </h1>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
          <Bell size={24} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );

  // --- 화면: 대시보드 ---
  const DashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">총 보유 현금</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(152000000)}</h2>
          <p className="text-sm text-emerald-600 flex items-center gap-1">
            ↑ 전월 대비 3.4% 증가
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">예상 런웨이 (Runway)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-500 rounded-full inline-block"></span> 12.5개월
          </h2>
          <p className="text-sm text-slate-500">안정적인 현금흐름 유지 중</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">이번 달 현금 연소율 (Burn Rate)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(-500000)}</h2>
          <p className="text-sm text-slate-500">지출이 수입보다 약간 많습니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">현금흐름 및 잔액 추이</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value * 10000)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="잔액" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" name="총 잔액" />
                <Line type="monotone" dataKey="수입" stroke="#10b981" strokeWidth={2} dot={false} name="수입" />
                <Line type="monotone" dataKey="지출" stroke="#ef4444" strokeWidth={2} dot={false} name="지출" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Action Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            AI Action Items <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md">할 일 2개</span>
          </h3>
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 cursor-pointer hover:bg-orange-100 transition" onClick={() => setActiveTab('transactions')}>
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-orange-900 text-sm">2건의 내역 분류가 필요합니다.</p>
                <p className="text-orange-700 text-xs mt-1">AI가 계정과목을 확신하지 못했습니다. 확인 후 승인해주세요.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-slate-700 text-sm">국민은행 계좌 연동 완료</p>
                <p className="text-slate-500 text-xs mt-1">오늘 오전 03:00에 최신 내역을 성공적으로 동기화했습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- 화면: 거래 내역 (AI 분개장) ---
  const TransactionsView = () => (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="거래처, 적요 검색..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Filter size={16} /> 상태: 전체
            </button>
          </div>
          <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm">
            선택 항목 일괄 확정
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4">날짜</th>
                <th className="p-4">거래처 (적요)</th>
                <th className="p-4 text-right">금액</th>
                <th className="p-4 w-64">AI 계정 태그</th>
                <th className="p-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition group">
                  <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="p-4 font-medium text-slate-900">{tx.merchant}</td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'in' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4">
                    {/* 🌟 핵심 UX: AI 확신도에 따른 태그 렌더링 */}
                    {tx.confidence >= 0.9 ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium cursor-pointer hover:bg-emerald-100 transition">
                        {tx.aiTag} <ChevronDown size={14} className="opacity-50" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-300 text-sm font-medium cursor-pointer hover:bg-amber-100 transition shadow-sm">
                        {tx.aiTag}? (확인요망) <ChevronDown size={14} className="opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {tx.confidence >= 0.9 ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">자동 분류됨</span>
                    ) : (
                      <button className="text-xs font-bold text-white bg-amber-500 px-3 py-1 rounded-full hover:bg-amber-600 transition shadow-sm">확정하기</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- 화면: 연동 및 설정 ---
  const IntegrationsView = () => (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl">
        <h2 className="text-lg font-bold text-slate-800 mb-4">금융 기관 연동</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">기업 은행 계좌</h3>
                  <p className="text-sm text-slate-500">모든 입출금 내역 자동 수집</p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">연동됨</span>
              </div>
              <p className="text-xs text-slate-400 mt-4">마지막 동기화: 오늘 03:00</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">법인 카드</h3>
                  <p className="text-sm text-slate-500">카드 지출 내역 자동 수집</p>
                </div>
                <button className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-slate-800 transition">
                  연동하기
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">미연동 상태</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'integrations' && <IntegrationsView />}
        </main>
      </div>
    </div>
  );
}