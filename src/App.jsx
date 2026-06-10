import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Home, Receipt, Settings, Bell, User, Search, AlertCircle, CheckCircle2, ChevronDown, 
  CreditCard, Building2, Wallet, Filter, Upload, FileSpreadsheet, FileText, X, Loader2, RefreshCw, Plus
} from 'lucide-react';

// --- 차트용 더미 데이터 ---
const cashFlowData = [
  { month: '1월', 수입: 4500, 지출: 3200, 잔액: 12000 },
  { month: '2월', 수입: 5200, 지출: 3800, 잔액: 13400 },
  { month: '3월', 수입: 4800, 지출: 6500, 잔액: 11700 },
  { month: '4월', 수입: 6100, 지출: 4200, 잔액: 13600 },
  { month: '5월', 수입: 5900, 지출: 4800, 잔액: 14700 },
  { month: '6월', 수입: 2000, 지출: 1500, 잔액: 15200 },
];

// --- 🌟 과제 시연용 풍부한 데모 데이터 ---
const demoTransactions = [
  { id: 1, date: '2026-06-10 14:30', merchant: '토스페이먼츠(주)', type: 'in', amount: 2500000, aiTag: '매출', confidence: 0.98, status: '분류 완료' },
  { id: 2, date: '2026-06-09 10:15', merchant: '구글클라우드', type: 'out', amount: 420000, aiTag: '지급수수료', confidence: 0.95, status: '분류 완료' },
  { id: 3, date: '2026-06-08 19:30', merchant: '배달의민족', type: 'out', amount: 68000, aiTag: '복리후생비', confidence: 0.65, status: '확인 필요' },
  { id: 4, date: '2026-06-08 14:00', merchant: '국세청(법인세)', type: 'out', amount: 3500000, aiTag: '세금과공과', confidence: 0.99, status: '분류 완료' },
  { id: 5, date: '2026-06-07 11:20', merchant: '쿠팡(주)', type: 'out', amount: 125000, aiTag: '소모품비', confidence: 0.55, status: '확인 필요' },
  { id: 6, date: '2026-06-06 09:00', merchant: '국민연금공단', type: 'out', amount: 850000, aiTag: '세금과공과', confidence: 0.91, status: '분류 완료' },
  { id: 7, date: '2026-06-05 18:40', merchant: '이마트', type: 'out', amount: 45000, aiTag: '소모품비', confidence: 0.70, status: '확인 필요' },
  { id: 8, date: '2026-06-04 13:20', merchant: '(주)패스트파이브', type: 'out', amount: 2200000, aiTag: '지급임차료', confidence: 0.96, status: '분류 완료' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 초기에는 비어있는 상태로 시작 (사용자가 직접 데이터를 채우는 경험을 위해)
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🌟 업로드 모달 상태 관리 (0: 닫힘, 1: 업로드대기, 2: 분석중, 3: 결과검수)
  const [uploadStep, setUploadStep] = useState(0);
  const [draftTx, setDraftTx] = useState({ date: '', merchant: '', amount: '', aiTag: '', type: 'out' });
  const [showSuccessToast, setShowSuccessToast] = useState('');

  const formatCurrency = (value) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Number(value) || 0);

  const actionRequiredCount = transactions.filter(tx => tx.status === '확인 필요').length;
  const filteredTransactions = transactions.filter(tx => 
    tx.merchant.includes(searchTerm) || tx.aiTag.includes(searchTerm)
  );

  // 🌟 기능 1: 시연용 데모 데이터 초기화
  const handleLoadDemoData = () => {
    setTransactions(demoTransactions);
    setShowSuccessToast('시뮬레이션 데모 데이터가 로드되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
  };

  // 🌟 기능 2: 영수증 업로드 및 AI 추출 시뮬레이션
  const handleFileDrop = (e) => {
    e.preventDefault();
    setUploadStep(2); // 분석 중 상태로 변경
    
    // AI 추출 시뮬레이션 (2초 후 검수 화면으로 이동)
    setTimeout(() => {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-06-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setDraftTx({
        date: formattedDate,
        merchant: '(주)스타벅스코리아',
        amount: '25500',
        aiTag: '복리후생비',
        type: 'out'
      });
      setUploadStep(3); // 결과 검수 상태로 변경
    }, 2000);
  };

  // 🌟 기능 3: 검수 완료 및 실제 데이터 배열에 추가
  const handleSaveDraft = (e) => {
    e.preventDefault();
    const newTransaction = {
      id: Date.now(),
      date: draftTx.date,
      merchant: draftTx.merchant,
      type: draftTx.type,
      amount: parseInt(draftTx.amount, 10),
      aiTag: draftTx.aiTag,
      confidence: 1, // 사용자가 직접 확인했으므로 확신도 100%
      status: '분류 완료'
    };
    
    setTransactions([newTransaction, ...transactions]);
    setUploadStep(0);
    setShowSuccessToast('새로운 거래 내역이 장부에 기록되었습니다.');
    setTimeout(() => setShowSuccessToast(''), 3000);
    setActiveTab('transactions');
  };

  // 기능 4: 엑셀(CSV) 다운로드
  const handleDownloadCSV = () => {
    if(transactions.length === 0) return alert("다운로드할 데이터가 없습니다.");
    const headers = ['날짜', '거래처', '분류', '구분', '금액', '상태'];
    const csvData = transactions.map(tx => {
      const typeStr = tx.type === 'in' ? '입금' : '출금';
      return `${tx.date},${tx.merchant},${tx.aiTag},${typeStr},${tx.amount},${tx.status}`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + csvData.join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "부기_재무거래내역.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 print:hidden">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Wallet size={20} className="text-white" />
        </div>
        Boogie
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Home size={20} /> 대시보드
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'transactions' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Receipt size={20} /> 거래 내역
          {actionRequiredCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{actionRequiredCount}</span>}
        </button>
        <button onClick={() => setActiveTab('integrations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'integrations' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800'}`}>
          <Settings size={20} /> 연동 및 설정
        </button>
      </nav>
      {/* 데모 시연을 위한 초기화 버튼 (눈에 잘 띄게 배치) */}
      <div className="p-6 border-t border-slate-800">
        <button 
          onClick={handleLoadDemoData}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 py-2 rounded-lg text-sm transition"
        >
          <RefreshCw size={14} /> 시뮬레이션 데이터 로드
        </button>
      </div>
    </div>
  );

  const renderTopbar = () => (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
      <h1 className="text-2xl font-bold text-slate-800">
        {activeTab === 'dashboard' && '재무 대시보드'}
        {activeTab === 'transactions' && 'AI 거래 내역'}
        {activeTab === 'integrations' && '연동 및 설정'}
      </h1>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setUploadStep(1)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
        >
          <Plus size={16} /> 영수증/증빙 입력
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
          <Bell size={24} />
          {actionRequiredCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-end print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm">
          <FileText size={16} className="text-indigo-600" /> 월간 재무 보고서 (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">총 보유 현금</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(152000000)}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">예상 런웨이 (Runway)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-emerald-500 rounded-full inline-block"></span> 12.5개월
          </h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">처리된 거래 건수 (이번 달)</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{transactions.length}건</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <Tooltip formatter={(value) => formatCurrency(value * 10000)} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="잔액" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" name="총 잔액" />
                <Line type="monotone" dataKey="수입" stroke="#10b981" strokeWidth={2} dot={false} name="수입" />
                <Line type="monotone" dataKey="지출" stroke="#ef4444" strokeWidth={2} dot={false} name="지출" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col print:hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            AI Action Items 
          </h3>
          <div className="space-y-4 flex-1">
            {transactions.length === 0 ? (
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center h-full text-slate-500">
                 데이터가 없습니다.<br/>시뮬레이션 데이터를 로드해주세요.
               </div>
            ) : actionRequiredCount > 0 ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 cursor-pointer hover:bg-orange-100 transition" onClick={() => setActiveTab('transactions')}>
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-orange-900 text-sm">{actionRequiredCount}건의 내역 분류가 필요합니다.</p>
                  <p className="text-orange-700 text-xs mt-1">AI가 계정과목을 확신하지 못했습니다.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">모든 내역이 분류되었습니다!</p>
                  <p className="text-emerald-700 text-xs mt-1">추가로 확인할 내역이 없습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsView = () => (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="거래처, 적요 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" 
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <FileSpreadsheet size={16} className="text-emerald-600" /> 엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4">날짜</th>
                <th className="p-4">거래처 (적요)</th>
                <th className="p-4 text-right">금액</th>
                <th className="p-4 w-64">계정 과목</th>
                <th className="p-4 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition group">
                  <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="p-4 font-medium text-slate-900">{tx.merchant}</td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'in' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4">
                    {tx.status === '분류 완료' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm font-medium">
                        {tx.aiTag}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-300 text-sm font-medium shadow-sm">
                        {tx.aiTag}? (확인요망)
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {tx.status === '분류 완료' ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">완료</span>
                    ) : (
                      <button 
                        onClick={() => {
                          const updated = transactions.map(t => t.id === tx.id ? { ...t, status: '분류 완료', confidence: 1 } : t);
                          setTransactions(updated);
                        }}
                        className="text-xs font-bold text-white bg-amber-500 px-3 py-1 rounded-full hover:bg-amber-600 transition shadow-sm"
                      >
                        확정하기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    데이터가 없습니다. 좌측 하단의 <b>[시뮬레이션 데이터 로드]</b> 버튼을 누르거나 새로 입력해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {renderSidebar()}
      <div className="flex-1 ml-64 flex flex-col">
        {renderTopbar()}
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && renderDashboardView()}
          {activeTab === 'transactions' && renderTransactionsView()}
          {activeTab === 'integrations' && <div className="p-8 text-slate-500">연동 및 설정 화면 (준비 중)</div>}
        </main>
      </div>

      {/* 🌟 인터랙티브 업로드/수기입력 모달 */}
      {uploadStep > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {uploadStep === 1 ? '영수증/증빙 업로드' : uploadStep === 2 ? 'AI 분석 중' : 'AI 추출 결과 확인'}
              </h3>
              <button onClick={() => setUploadStep(0)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6">
              {uploadStep === 1 && (
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center p-12 cursor-pointer group"
                  onClick={handleFileDrop}
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Upload size={28} className="text-indigo-500" />
                  </div>
                  <p className="text-slate-700 font-medium text-center">클릭하여 영수증 파일을 첨부하세요</p>
                  <p className="text-slate-400 text-sm mt-2 text-center">과제 시연용: 클릭 시 AI 자동 추출 시뮬레이션 시작</p>
                </div>
              )}

              {uploadStep === 2 && (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-800 font-bold text-lg">AI가 영수증을 분석하고 있습니다...</p>
                  <p className="text-slate-500 text-sm mt-2">금액과 계정과목을 추출하는 중입니다.</p>
                </div>
              )}

              {uploadStep === 3 && (
                <form onSubmit={handleSaveDraft} className="space-y-4">
                  <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-sm font-medium mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} /> AI가 영수증 정보를 성공적으로 추출했습니다. 내역을 수정하거나 확정해주세요.
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">날짜</label>
                      <input type="text" value={draftTx.date} onChange={(e) => setDraftTx({...draftTx, date: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">구분</label>
                      <select value={draftTx.type} onChange={(e) => setDraftTx({...draftTx, type: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                        <option value="out">출금 (지출)</option>
                        <option value="in">입금 (수입)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">거래처 (적요)</label>
                    <input type="text" value={draftTx.merchant} onChange={(e) => setDraftTx({...draftTx, merchant: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">금액 (원)</label>
                      <input type="number" value={draftTx.amount} onChange={(e) => setDraftTx({...draftTx, amount: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">계정과목 (AI 추천)</label>
                      <input type="text" value={draftTx.aiTag} onChange={(e) => setDraftTx({...draftTx, aiTag: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-emerald-50 text-emerald-800 font-medium" required />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button type="button" onClick={() => setUploadStep(0)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold transition">취소</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition">장부에 기록하기</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 성공 토스트 알림 */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="font-medium">{showSuccessToast}</p>
        </div>
      )}
    </div>
  );
}