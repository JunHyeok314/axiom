import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, RotateCcw, Check, X, ArrowLeft, Play, BookOpen, Layers, Target, AlignCenter } from 'lucide-react';

// ==========================================
// 1. 아미노산 데이터 및 SVG 구조식 자산
// ==========================================

// 화학 구조식의 원자 기호를 선명하게 표시하기 위한 헬퍼 컴포넌트
// paintOrder="stroke"를 사용하여 글자 주변의 결합선(Line)을 깔끔하게 가려줍니다.
const Node = ({ x, y, text, color = "#333", size = 14 }) => (
  <text 
    x={x} 
    y={y} 
    textAnchor="middle" 
    fontSize={size} 
    fill={color} 
    fontWeight="bold" 
    stroke="#FCFBF7" 
    strokeWidth="5" 
    paintOrder="stroke" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    fontFamily="sans-serif"
  >
    {text}
  </text>
);

// 화학 구조식을 그리기 위한 공통 SVG 컴포넌트
const StructureSVG = ({ rGroupSvg, groupColor }) => (
  <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-sm" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}>
    <rect width="200" height="300" fill="#FCFBF7" rx="4" stroke="#E5E0D8" strokeWidth="1" />
    
    {/* 아미노산 기본 골격 (Backbone) */}
    <g stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="100" y1="80" x2="60" y2="80" />  {/* Alpha C to NH2 */}
      <line x1="100" y1="80" x2="140" y2="80" /> {/* Alpha C to COOH */}
      <line x1="100" y1="80" x2="100" y2="40" />  {/* Alpha C to H */}
      <line x1="100" y1="80" x2="100" y2="110" strokeDasharray="4 2"/> {/* Alpha C to R (연결선 강조) */}
    </g>
    
    {/* 기본 골격 텍스트 */}
    <text x="40" y="85" fontSize="16" fill="#2C3E50" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">H₂N</text>
    <text x="160" y="85" fontSize="16" fill="#2C3E50" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">COOH</text>
    <text x="100" y="30" fontSize="16" fill="#2C3E50" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">H</text>

    {/* R 그룹 (곁사슬) 렌더링 영역 */}
    <g transform="translate(100, 110)">
      {/* R그룹 배경 강조 (그룹 색상) */}
      <circle cx="0" cy="50" r="70" fill={groupColor} opacity="0.1" />
      {rGroupSvg}
    </g>
  </svg>
);

// R 그룹 (곁사슬) 명시적 SVG 정의 (모든 CH/CH2/CH3 표기)
const R_GROUPS = {
  // 비극성 (Nonpolar)
  gly: <Node x="0" y="15" text="H" size="16" />,
  ala: (
    <>
      <line x1="0" y1="0" x2="0" y2="30" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₃" />
    </>
  ),
  val: (
    <>
      <polyline points="0,0 0,30 -20,60" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="0" y1="30" x2="20" y2="60" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH" />
      <Node x="-25" y="65" text="H₃C" />
      <Node x="25" y="65" text="CH₃" />
    </>
  ),
  leu: (
    <>
      <polyline points="0,0 0,55 -20,85" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="0" y1="55" x2="20" y2="85" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="0" y="60" text="CH" />
      <Node x="-25" y="90" text="H₃C" />
      <Node x="25" y="90" text="CH₃" />
    </>
  ),
  ile: (
    <>
      <polyline points="0,0 0,25 -20,55 -20,85" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="0" y1="25" x2="20" y2="55" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH" />
      <Node x="-20" y="60" text="CH₂" />
      <Node x="25" y="60" text="CH₃" />
      <Node x="-20" y="90" text="CH₃" />
    </>
  ),
  met: (
    <>
      <polyline points="0,0 0,115" fill="none" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="0" y="60" text="CH₂" />
      <Node x="0" y="90" text="S" color="#E6A817" />
      <Node x="0" y="120" text="CH₃" />
    </>
  ),
  pro: (
    <>
      <polyline points="0,0 0,30 -30,40 -40,5 -40,-30" fill="none" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="-30" y="45" text="CH₂" />
      <Node x="-45" y="10" text="CH₂" />
    </>
  ),
  // 방향족 (Aromatic)
  phe: (
    <>
      <line x1="0" y1="0" x2="0" y2="55" stroke="#333" strokeWidth="2" />
      <polygon points="0,55 17,65 17,85 0,95 -17,85 -17,65" fill="none" stroke="#333" strokeWidth="2" />
      <circle cx="0" cy="75" r="10" fill="none" stroke="#333" strokeWidth="1.5" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="25" y="67" text="CH" />
      <Node x="25" y="92" text="CH" />
      <Node x="0" y="108" text="CH" />
      <Node x="-25" y="92" text="HC" />
      <Node x="-25" y="67" text="HC" />
    </>
  ),
  tyr: (
    <>
      <line x1="0" y1="0" x2="0" y2="55" stroke="#333" strokeWidth="2" />
      <polygon points="0,55 17,65 17,85 0,95 -17,85 -17,65" fill="none" stroke="#333" strokeWidth="2" />
      <circle cx="0" cy="75" r="10" fill="none" stroke="#333" strokeWidth="1.5" />
      <line x1="0" y1="95" x2="0" y2="115" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="25" y="67" text="CH" />
      <Node x="25" y="92" text="CH" />
      <Node x="-25" y="92" text="HC" />
      <Node x="-25" y="67" text="HC" />
      <Node x="0" y="125" text="OH" color="#D32F2F" />
    </>
  ),
  trp: (
    <>
      <line x1="0" y1="0" x2="0" y2="55" stroke="#333" strokeWidth="2" />
      <polygon points="0,55 15,65 10,85 -5,85 -15,65" fill="none" stroke="#333" strokeWidth="2" />
      <polygon points="15,65 30,55 45,65 40,85 25,95 10,85" fill="none" stroke="#333" strokeWidth="2" />
      <circle cx="27" cy="75" r="9" fill="none" stroke="#333" strokeWidth="1.5" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="-22" y="68" text="HC" />
      <Node x="-10" y="95" text="NH" color="#1976D2" />
      <Node x="30" y="50" text="CH" />
      <Node x="50" y="70" text="CH" />
      <Node x="45" y="95" text="CH" />
      <Node x="25" y="108" text="CH" />
    </>
  ),
  // 극성 (Polar)
  ser: (
    <>
      <line x1="0" y1="0" x2="0" y2="60" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="OH" color="#D32F2F" />
    </>
  ),
  thr: (
    <>
      <polyline points="0,0 0,30 -20,55" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="0" y1="30" x2="20" y2="55" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH" />
      <Node x="-25" y="60" text="OH" color="#D32F2F" />
      <Node x="25" y="60" text="CH₃" />
    </>
  ),
  cys: (
    <>
      <line x1="0" y1="0" x2="0" y2="60" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="SH" color="#E6A817" />
    </>
  ),
  asn: (
    <>
      <polyline points="0,0 0,60 -20,85" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="2" y1="60" x2="22" y2="85" stroke="#333" strokeWidth="2" />
      <line x1="-2" y1="60" x2="18" y2="85" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="C" />
      <Node x="-25" y="90" text="H₂N" color="#1976D2" />
      <Node x="25" y="90" text="O" color="#D32F2F" />
    </>
  ),
  gln: (
    <>
      <polyline points="0,0 0,90 -20,115" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="2" y1="90" x2="22" y2="115" stroke="#333" strokeWidth="2" />
      <line x1="-2" y1="90" x2="18" y2="115" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="CH₂" />
      <Node x="0" y="95" text="C" />
      <Node x="-25" y="120" text="H₂N" color="#1976D2" />
      <Node x="25" y="120" text="O" color="#D32F2F" />
    </>
  ),
  // 양전하성 (Positive)
  lys: (
    <>
      <line x1="0" y1="0" x2="0" y2="125" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="0" y="55" text="CH₂" />
      <Node x="0" y="80" text="CH₂" />
      <Node x="0" y="105" text="CH₂" />
      <Node x="0" y="130" text="NH₃⁺" color="#1976D2" />
    </>
  ),
  arg: (
    <>
      <polyline points="0,0 0,125 -20,150" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="2" y1="125" x2="22" y2="150" stroke="#333" strokeWidth="2" />
      <line x1="-2" y1="125" x2="18" y2="150" stroke="#333" strokeWidth="2" />
      <Node x="0" y="30" text="CH₂" />
      <Node x="0" y="55" text="CH₂" />
      <Node x="0" y="80" text="CH₂" />
      <Node x="0" y="105" text="NH" color="#1976D2" />
      <Node x="0" y="130" text="C" />
      <Node x="-25" y="155" text="H₂N" color="#1976D2" />
      <Node x="25" y="155" text="NH₂⁺" color="#1976D2" />
    </>
  ),
  his: (
    <>
      <line x1="0" y1="0" x2="0" y2="60" stroke="#333" strokeWidth="2" />
      <polygon points="0,60 15,75 10,100 -10,100 -15,75" fill="none" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="55" text="C" />
      <Node x="22" y="78" text="NH" color="#1976D2" />
      <Node x="15" y="108" text="CH" />
      <Node x="-15" y="108" text="N" color="#1976D2" />
      <Node x="-22" y="78" text="HC" />
    </>
  ),
  // 음전하성 (Negative)
  asp: (
    <>
      <polyline points="0,0 0,60 -20,85" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="2" y1="60" x2="22" y2="85" stroke="#333" strokeWidth="2" />
      <line x1="-2" y1="60" x2="18" y2="85" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="C" />
      <Node x="-25" y="90" text="O⁻" color="#D32F2F" />
      <Node x="25" y="90" text="O" color="#D32F2F" />
    </>
  ),
  glu: (
    <>
      <polyline points="0,0 0,90 -20,115" fill="none" stroke="#333" strokeWidth="2" />
      <line x1="2" y1="90" x2="22" y2="115" stroke="#333" strokeWidth="2" />
      <line x1="-2" y1="90" x2="18" y2="115" stroke="#333" strokeWidth="2" />
      <Node x="0" y="35" text="CH₂" />
      <Node x="0" y="65" text="CH₂" />
      <Node x="0" y="95" text="C" />
      <Node x="-25" y="120" text="O⁻" color="#D32F2F" />
      <Node x="25" y="120" text="O" color="#D32F2F" />
    </>
  ),
};

const GROUPS = {
  nonpolar: { id: 'nonpolar', kr: '비극성', color: '#D4B895', bg: 'bg-[#FDF8F2]', border: 'border-[#D4B895]', text: 'text-[#8B5A2B]' },
  aromatic: { id: 'aromatic', kr: '방향족', color: '#B088B9', bg: 'bg-[#F9F5FA]', border: 'border-[#B088B9]', text: 'text-[#6A2C70]' },
  positive: { id: 'positive', kr: '양전하성', color: '#88B4D4', bg: 'bg-[#F2F8FC]', border: 'border-[#88B4D4]', text: 'text-[#2C6E9E]' },
  polar: { id: 'polar', kr: '극성', color: '#88C9B4', bg: 'bg-[#F2FCF8]', border: 'border-[#88C9B4]', text: 'text-[#287A5E]' },
  negative: { id: 'negative', kr: '음전하성', color: '#E59898', bg: 'bg-[#FCF2F2]', border: 'border-[#E59898]', text: 'text-[#9E2A2B]' },
};

const AMINO_ACIDS = [
  { id: 'gly', kr: '글리신', en: 'Glycine', c3: 'Gly', c1: 'G', group: 'nonpolar', struct: R_GROUPS.gly },
  { id: 'ala', kr: '알라닌', en: 'Alanine', c3: 'Ala', c1: 'A', group: 'nonpolar', struct: R_GROUPS.ala },
  { id: 'val', kr: '발린', en: 'Valine', c3: 'Val', c1: 'V', group: 'nonpolar', struct: R_GROUPS.val },
  { id: 'leu', kr: '류신', en: 'Leucine', c3: 'Leu', c1: 'L', group: 'nonpolar', struct: R_GROUPS.leu },
  { id: 'ile', kr: '아이소류신', en: 'Isoleucine', c3: 'Ile', c1: 'I', group: 'nonpolar', struct: R_GROUPS.ile },
  { id: 'met', kr: '메싸이오닌', en: 'Methionine', c3: 'Met', c1: 'M', group: 'nonpolar', struct: R_GROUPS.met },
  { id: 'pro', kr: '프롤린', en: 'Proline', c3: 'Pro', c1: 'P', group: 'nonpolar', struct: R_GROUPS.pro },
  { id: 'phe', kr: '페닐알라닌', en: 'Phenylalanine', c3: 'Phe', c1: 'F', group: 'aromatic', struct: R_GROUPS.phe },
  { id: 'tyr', kr: '티로신', en: 'Tyrosine', c3: 'Tyr', c1: 'Y', group: 'aromatic', struct: R_GROUPS.tyr },
  { id: 'trp', kr: '트립토판', en: 'Tryptophan', c3: 'Trp', c1: 'W', group: 'aromatic', struct: R_GROUPS.trp },
  { id: 'ser', kr: '세린', en: 'Serine', c3: 'Ser', c1: 'S', group: 'polar', struct: R_GROUPS.ser },
  { id: 'thr', kr: '트레오닌', en: 'Threonine', c3: 'Thr', c1: 'T', group: 'polar', struct: R_GROUPS.thr },
  { id: 'cys', kr: '시스테인', en: 'Cysteine', c3: 'Cys', c1: 'C', group: 'polar', struct: R_GROUPS.cys },
  { id: 'asn', kr: '아스파라긴', en: 'Asparagine', c3: 'Asn', c1: 'N', group: 'polar', struct: R_GROUPS.asn },
  { id: 'gln', kr: '글루타민', en: 'Glutamine', c3: 'Gln', c1: 'Q', group: 'polar', struct: R_GROUPS.gln },
  { id: 'lys', kr: '리신', en: 'Lysine', c3: 'Lys', c1: 'K', group: 'positive', struct: R_GROUPS.lys },
  { id: 'arg', kr: '아르기닌', en: 'Arginine', c3: 'Arg', c1: 'R', group: 'positive', struct: R_GROUPS.arg },
  { id: 'his', kr: '히스티딘', en: 'Histidine', c3: 'His', c1: 'H', group: 'positive', struct: R_GROUPS.his },
  { id: 'asp', kr: '아스파르트산', en: 'Aspartate', c3: 'Asp', c1: 'D', group: 'negative', struct: R_GROUPS.asp },
  { id: 'glu', kr: '글루탐산', en: 'Glutamate', c3: 'Glu', c1: 'E', group: 'negative', struct: R_GROUPS.glu },
];

// 유틸리티 함수: 배열 섞기
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

// ==========================================
// 2. 공통 UI 컴포넌트
// ==========================================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border-2 border-[#E5E0D8] rounded-md shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ group }) => {
  const g = GROUPS[group];
  return (
    <span className={`inline-block px-2 py-1 text-xs font-bold border rounded-sm ${g.bg} ${g.text} ${g.border}`}>
      {g.kr}
    </span>
  );
};

// ==========================================
// 3. 메인 앱 레이아웃 및 탭 라우팅
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('intro');

  const renderTab = () => {
    switch (activeTab) {
      case 'intro': return <IntroMode setTab={setActiveTab} />;
      case 'study': return <StudyMode />;
      case 'structure': return <QuizMode type="structure" onBack={() => setActiveTab('intro')} />;
      case 'time': return <TimeAttackMode onBack={() => setActiveTab('intro')} />;
      case 'name': return <QuizMode type="name" onBack={() => setActiveTab('intro')} />;
      case 'property': return <PropertyMode onBack={() => setActiveTab('intro')} />;
      default: return <IntroMode setTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C3E50] font-sans">
      {/* 헤더 */}
      <header className="bg-[#1E392A] text-[#FDFBF7] p-4 shadow-md border-b-4 border-[#800020]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">아미노마스터</h1>
            <p className="text-xs text-[#A8B8AD] mt-1 font-mono">기본 실력 향상을 위한 생화학 필수 과정</p>
          </div>
          <BookOpen className="w-8 h-8 opacity-70" />
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="max-w-4xl mx-auto mt-6 px-4">
        <div className="flex flex-wrap gap-2 border-b-2 border-[#E5E0D8] pb-1">
          {[
            { id: 'intro', label: '홈' },
            { id: 'study', label: '학습모드', icon: <BookOpen size={16} /> },
            { id: 'structure', label: '구조모드', icon: <Layers size={16} /> },
            { id: 'time', label: '타임어택', icon: <Clock size={16} /> },
            { id: 'name', label: '이름모드', icon: <Target size={16} /> },
            { id: 'property', label: '속성모드', icon: <AlignCenter size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-4 py-2 rounded-t-md font-bold transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#FDFBF7] text-[#1E392A] border-2 border-b-0 border-[#E5E0D8] translate-y-[3px]' 
                  : 'bg-[#EAE5DB] text-[#5C6D63] hover:bg-[#DED9CF]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        {renderTab()}
      </main>
    </div>
  );
}

// ==========================================
// 모드 0: 인트로 화면
// ==========================================
function IntroMode({ setTab }) {
  const modes = [
    { id: 'study', title: '1. 학습모드', desc: '20가지 표준 아미노산의 구조와 성질을 차분히 익힙니다.', icon: BookOpen },
    { id: 'structure', title: '2. 구조모드', desc: '구조식을 보고 올바른 아미노산 이름을 맞히는 연습문제.', icon: Layers },
    { id: 'name', title: '3. 이름모드', desc: '이름을 보고 올바른 구조식을 찾아내는 역방향 연습문제.', icon: Target },
    { id: 'time', title: '4. 타임어택', desc: '60초 제한시간 내에 구조식을 보고 주관식으로 입력합니다.', icon: Clock },
    { id: 'property', title: '5. 속성모드', desc: '아미노산을 성질(극성/비극성 등)에 맞게 직접 분류합니다.', icon: AlignCenter },
  ];

  return (
    <div className="animate-fade-in text-center space-y-10">
      <div className="border-4 border-double border-[#1E392A] p-10 bg-white max-w-2xl mx-auto rounded-sm shadow-md">
        <h2 className="text-4xl font-serif font-bold text-[#1E392A] mb-4">아미노마스터</h2>
        <p className="text-lg text-[#5C6D63] mb-8">
          단백질을 구성하는 20가지 표준 아미노산.<br/>
          구조, 이름, 성질을 완벽하게 숙지하기 위한 자기주도 학습 프로그램.
        </p>
        <button 
          onClick={() => setTab('study')}
          className="bg-[#800020] text-white px-8 py-3 rounded-sm font-bold text-lg hover:bg-[#600018] transition-colors shadow-sm flex items-center justify-center mx-auto gap-2"
        >
          <Play size={20} /> 학습 시작하기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <div 
              key={mode.id} 
              onClick={() => setTab(mode.id)}
              className="cursor-pointer bg-white p-5 border-2 border-[#E5E0D8] rounded-md hover:border-[#1E392A] transition-all group shadow-sm flex items-start gap-4"
            >
              <div className="p-3 bg-[#F4F1EA] rounded-full text-[#1E392A] group-hover:bg-[#1E392A] group-hover:text-white transition-colors">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{mode.title}</h3>
                <p className="text-sm text-[#5C6D63]">{mode.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 모드 1: 학습모드
// ==========================================
function StudyMode() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    return AMINO_ACIDS.filter(aa => {
      const matchFilter = filter === 'all' || aa.group === filter;
      const term = search.toLowerCase();
      const matchSearch = aa.kr.includes(term) || aa.en.toLowerCase().includes(term) || aa.c3.toLowerCase().includes(term) || aa.c1.toLowerCase() === term;
      return matchFilter && matchSearch;
    });
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border-2 border-[#E5E0D8] rounded-md flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm font-bold border rounded-sm ${filter === 'all' ? 'bg-[#1E392A] text-white' : 'bg-white text-[#5C6D63] border-[#E5E0D8]'}`}>전체보기</button>
          {Object.values(GROUPS).map(g => (
            <button 
              key={g.id} 
              onClick={() => setFilter(g.id)}
              className={`px-3 py-1 text-sm font-bold border rounded-sm transition-colors ${filter === g.id ? `${g.bg} ${g.text} ${g.border} border-2` : 'bg-white text-[#5C6D63] border-[#E5E0D8]'}`}
            >
              {g.kr}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="이름, 코드 검색..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-[#E5E0D8] rounded-sm focus:outline-none focus:border-[#1E392A]"
          />
          <Search className="absolute left-3 top-2.5 text-[#A8B8AD]" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(aa => (
          <Card key={aa.id} className="hover:border-[#1E392A] transition-all duration-300 transform hover:-translate-y-1">
            <div className="h-60 p-2 bg-white border-b-2 border-dashed border-[#E5E0D8] flex justify-center items-center">
              <div className="w-40 h-56">
                <StructureSVG rGroupSvg={aa.struct} groupColor={GROUPS[aa.group].color} />
              </div>
            </div>
            <div className="p-4 bg-[#FAFAF8]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-xl">{aa.kr}</h3>
                  <p className="text-sm text-[#5C6D63] font-serif">{aa.en}</p>
                </div>
                <Badge group={aa.group} />
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#E5E0D8]">
                <div className="text-center">
                  <span className="block text-xs text-[#A8B8AD]">3-letter</span>
                  <span className="font-mono font-bold">{aa.c3}</span>
                </div>
                <div className="text-center">
                  <span className="block text-xs text-[#A8B8AD]">1-letter</span>
                  <span className="font-mono font-bold text-lg">{aa.c1}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full text-center py-10 text-[#5C6D63]">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 모드 2 & 4: 퀴즈 모드 (구조모드 / 이름모드 통합)
// ==========================================
function QuizMode({ type, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [status, setStatus] = useState('start'); // start, playing, result, review
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'

  // 게임 초기화
  const initGame = (reviewMode = false) => {
    let pool = reviewMode ? wrongAnswers.map(wa => wa.question) : AMINO_ACIDS;
    pool = shuffle(pool).slice(0, 20); // 최대 20문제

    const generatedQuestions = pool.map(target => {
      let options = [target];
      let others = shuffle(AMINO_ACIDS.filter(a => a.id !== target.id));
      options.push(...others.slice(0, 3));
      return {
        target,
        options: shuffle(options)
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    if (!reviewMode) setWrongAnswers([]);
    setStatus('playing');
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleSelect = (option) => {
    if (feedback) return; // 이미 선택함
    setSelectedOption(option);
    
    const isCorrect = option.id === questions[currentIndex].target.id;
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
      if (!wrongAnswers.find(wa => wa.question.id === questions[currentIndex].target.id)) {
        setWrongAnswers(prev => [...prev, { question: questions[currentIndex].target, selected: option }]);
      }
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setStatus('result');
      }
    }, 1200);
  };

  if (status === 'start') {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-serif font-bold mb-4">
          {type === 'structure' ? '연습문제 1: 구조식 판별' : '연습문제 2: 명칭 매칭'}
        </h2>
        <p className="mb-8 text-[#5C6D63]">총 20문제가 랜덤으로 출제됩니다.</p>
        <button onClick={() => initGame()} className="bg-[#1E392A] text-white px-8 py-3 rounded-sm font-bold text-lg hover:bg-[#12231A] transition-colors">
          시험 시작
        </button>
      </div>
    );
  }

  if (status === 'result') {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 border-4 border-double border-[#1E392A] rounded-sm text-center">
        <h2 className="text-3xl font-serif font-bold mb-6 text-[#1E392A]">채점 결과</h2>
        <div className="text-6xl font-bold mb-6 text-[#800020]">
          {Math.round((score / questions.length) * 100)}점
        </div>
        <div className="text-lg mb-8 bg-[#F4F1EA] p-4 rounded-sm border border-[#E5E0D8]">
          총 {questions.length}문제 중 <strong className="text-green-700">{score}</strong>개 정답, <strong className="text-red-700">{questions.length - score}</strong>개 오답
        </div>

        {wrongAnswers.length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="font-bold border-b-2 border-[#1E392A] pb-2 mb-4">오답 노트</h3>
            <ul className="space-y-2 text-sm">
              {wrongAnswers.map((wa, i) => (
                <li key={i} className="flex justify-between bg-red-50 p-2 border border-red-100 rounded-sm">
                  <span>정답: <strong>{wa.question.kr}</strong></span>
                  <span className="text-gray-500">선택: {wa.selected.kr}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center gap-4">
          {wrongAnswers.length > 0 && (
            <button onClick={() => initGame(true)} className="flex items-center gap-2 bg-[#800020] text-white px-6 py-2 rounded-sm font-bold hover:bg-[#600018]">
              <RotateCcw size={18} /> 오답 다시 풀기
            </button>
          )}
          <button onClick={onBack} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-2 rounded-sm font-bold hover:bg-gray-300">
            <ArrowLeft size={18} /> 메인으로
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-end mb-4 border-b-2 border-[#1E392A] pb-2">
        <div className="font-bold text-[#5C6D63]">문제 {currentIndex + 1} / {questions.length}</div>
        <div className="font-mono bg-[#EAE5DB] px-3 py-1 rounded-sm text-sm border border-[#DED9CF]">현재 점수: {score}</div>
      </div>

      <div className="bg-white p-8 border-2 border-[#E5E0D8] rounded-sm shadow-sm mb-6 flex flex-col items-center min-h-[350px] justify-center relative">
        {feedback && (
          <div className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 transition-all ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback === 'correct' ? <Check size={100} strokeWidth={3} /> : <X size={100} strokeWidth={3} />}
          </div>
        )}

        {type === 'structure' ? (
          <div className="w-56 h-72">
            <StructureSVG rGroupSvg={q.target.struct} groupColor={GROUPS[q.target.group].color} />
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2">{q.target.kr}</h2>
            <p className="text-xl text-gray-500 font-serif">{q.target.en}</p>
          </div>
        )}
      </div>

      <div className={`grid ${type === 'structure' ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={feedback !== null}
            onClick={() => handleSelect(opt)}
            className={`
              p-4 border-2 rounded-sm font-bold text-lg transition-all relative overflow-hidden
              ${selectedOption === opt 
                ? (opt.id === q.target.id ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800')
                : 'bg-white border-[#E5E0D8] hover:border-[#1E392A] hover:bg-[#FDFBF7]'}
            `}
          >
            {type === 'structure' ? opt.kr : (
               <div className="flex justify-center h-48">
                 <StructureSVG rGroupSvg={opt.struct} groupColor={GROUPS[opt.group].color} />
               </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 모드 3: 타임어택 모드
// ==========================================
function TimeAttackMode({ onBack }) {
  const [status, setStatus] = useState('start');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let timer;
    if (status === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && status === 'playing') {
      setStatus('result');
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const startGame = () => {
    setQuestions(shuffle(AMINO_ACIDS));
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(60);
    setInputVal('');
    setStatus('playing');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || feedback) return;

    const current = questions[currentIndex];
    const ans = inputVal.toLowerCase().trim();
    const isCorrect = 
      ans === current.kr || 
      ans === current.en.toLowerCase() || 
      ans === current.c3.toLowerCase() || 
      ans === current.c1.toLowerCase();

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setInputVal('');
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setStatus('result');
      }
    }, 500);
  };

  if (status === 'start') {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-serif font-bold mb-4 text-[#800020] flex justify-center items-center gap-2">
          <Clock /> 타임어택: 60초 주관식
        </h2>
        <p className="mb-8 text-[#5C6D63]">구조식을 보고 한글명, 영문명, 또는 코드를 빠르게 입력하세요.</p>
        <button onClick={startGame} className="bg-[#800020] text-white px-8 py-3 rounded-sm font-bold text-lg hover:bg-[#600018] transition-colors">
          도전 시작
        </button>
      </div>
    );
  }

  if (status === 'result') {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 border-4 border-double border-[#800020] rounded-sm text-center">
        <h2 className="text-3xl font-serif font-bold mb-6 text-[#800020]">종료</h2>
        <p className="text-gray-600 mb-2">제한시간 내 정답 수</p>
        <div className="text-7xl font-bold mb-8 text-[#1E392A]">{score}개</div>
        
        <div className="flex justify-center gap-4">
          <button onClick={startGame} className="flex items-center gap-2 bg-[#1E392A] text-white px-6 py-2 rounded-sm font-bold hover:bg-[#12231A]">
            <RotateCcw size={18} /> 다시 도전
          </button>
          <button onClick={onBack} className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-2 rounded-sm font-bold hover:bg-gray-300">
             메인으로
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6 bg-[#1E392A] text-white p-4 rounded-sm shadow-md">
        <div className="font-bold text-xl">문제 {currentIndex + 1}</div>
        <div className={`font-mono text-2xl font-bold flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}`}>
          <Clock size={20} /> 00:{timeLeft.toString().padStart(2, '0')}
        </div>
        <div className="font-bold text-xl">점수: {score}</div>
      </div>

      <div className="bg-white p-8 border-2 border-[#E5E0D8] rounded-sm shadow-sm mb-6 flex justify-center relative min-h-[350px]">
        {feedback && (
          <div className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 transition-all ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback === 'correct' ? <Check size={80} strokeWidth={4} /> : <X size={80} strokeWidth={4} />}
          </div>
        )}
        <div className="w-56 h-72">
           <StructureSVG rGroupSvg={q.struct} groupColor={GROUPS[q.group].color} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="이름 또는 코드 입력"
          autoFocus
          className="flex-1 text-center text-xl p-3 border-2 border-[#1E392A] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#800020]"
          disabled={feedback !== null}
        />
        <button type="submit" disabled={feedback !== null} className="bg-[#1E392A] text-white px-6 py-3 rounded-sm font-bold hover:bg-[#12231A]">
          입력
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 모드 5: 속성 드래그앤드롭 모드
// ==========================================
function PropertyMode({ onBack }) {
  const [unplaced, setUnplaced] = useState([]);
  const [bins, setBins] = useState({});
  const [status, setStatus] = useState('playing'); // playing, checked
  const [feedback, setFeedback] = useState(null);

  // 초기화
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setUnplaced(shuffle(AMINO_ACIDS));
    const initialBins = {};
    Object.keys(GROUPS).forEach(k => initialBins[k] = []);
    setBins(initialBins);
    setStatus('playing');
    setFeedback(null);
  };

  const onDragStart = (e, aaId, sourceGroup) => {
    e.dataTransfer.setData('aaId', aaId);
    e.dataTransfer.setData('sourceGroup', sourceGroup);
  };

  const onDrop = (e, targetGroup) => {
    e.preventDefault();
    if (status === 'checked') return;

    const aaId = e.dataTransfer.getData('aaId');
    const sourceGroup = e.dataTransfer.getData('sourceGroup');
    
    if (sourceGroup === targetGroup) return;

    const aa = AMINO_ACIDS.find(a => a.id === aaId);

    if (sourceGroup === 'unplaced') {
      setUnplaced(prev => prev.filter(a => a.id !== aaId));
    } else {
      setBins(prev => ({ ...prev, [sourceGroup]: prev[sourceGroup].filter(a => a.id !== aaId) }));
    }

    if (targetGroup === 'unplaced') {
      setUnplaced(prev => [...prev, aa]);
    } else {
      setBins(prev => ({ ...prev, [targetGroup]: [...prev[targetGroup], aa] }));
    }
  };

  const checkAnswers = () => {
    if (unplaced.length > 0) {
      alert('모든 카드를 분류함에 넣어주세요.');
      return;
    }

    let allCorrect = true;
    const newFeedback = {};

    Object.keys(bins).forEach(binKey => {
      bins[binKey].forEach(aa => {
        const isCorrect = aa.group === binKey;
        newFeedback[aa.id] = isCorrect;
        if (!isCorrect) allCorrect = false;
      });
    });

    setFeedback(newFeedback);
    setStatus('checked');
    
    if (allCorrect) {
      setTimeout(() => alert('완벽합니다! 모든 아미노산을 올바르게 분류했습니다.'), 100);
    }
  };

  const groupKeys = Object.keys(GROUPS);

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-[#1E392A]">분류 연습: 측쇄의 성질</h2>
        <div className="space-x-2">
          {status === 'playing' ? (
             <button onClick={checkAnswers} className="bg-[#1E392A] text-white px-4 py-2 rounded-sm font-bold text-sm hover:bg-[#12231A]">채점하기</button>
          ) : (
             <button onClick={resetGame} className="bg-[#800020] text-white px-4 py-2 rounded-sm font-bold text-sm hover:bg-[#600018] flex items-center gap-1"><RotateCcw size={14}/> 다시하기</button>
          )}
          <button onClick={onBack} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-sm font-bold text-sm hover:bg-gray-300">종료</button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-6 flex-1 min-h-[300px]">
        {groupKeys.map(key => {
          const g = GROUPS[key];
          return (
            <div 
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, key)}
              className={`border-2 ${g.border} ${g.bg} rounded-sm flex flex-col overflow-hidden`}
            >
              <div className={`text-center py-2 font-bold text-sm ${g.text} bg-white/50 border-b border-inherit`}>
                {g.kr} ({bins[key]?.length || 0})
              </div>
              <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-2">
                {bins[key]?.map(aa => (
                  <div 
                    key={aa.id}
                    draggable={status === 'playing'}
                    onDragStart={(e) => onDragStart(e, aa.id, key)}
                    className={`bg-white p-2 border rounded-sm shadow-sm cursor-grab text-center relative
                      ${feedback && feedback[aa.id] === false ? 'border-red-500 bg-red-50' : 'border-[#E5E0D8]'}
                      ${feedback && feedback[aa.id] === true ? 'border-green-500 bg-green-50' : ''}
                    `}
                  >
                    {feedback && feedback[aa.id] === false && <X className="absolute top-1 right-1 text-red-500" size={14} />}
                    {feedback && feedback[aa.id] === true && <Check className="absolute top-1 right-1 text-green-500" size={14} />}
                    <div className="h-20 flex justify-center mb-1">
                      <StructureSVG rGroupSvg={aa.struct} groupColor="#eee" />
                    </div>
                    <div className="text-xs font-bold">{aa.kr}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div 
        className="bg-white p-4 border-2 border-[#E5E0D8] rounded-sm min-h-[120px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, 'unplaced')}
      >
        <div className="text-sm font-bold text-[#5C6D63] mb-2 border-b pb-1">미분류 ({unplaced.length}) - 카드를 위 칸으로 드래그하세요</div>
        <div className="flex flex-wrap gap-2">
          {unplaced.map(aa => (
            <div 
              key={aa.id}
              draggable
              onDragStart={(e) => onDragStart(e, aa.id, 'unplaced')}
              className="bg-[#FAFAF8] border border-[#E5E0D8] px-3 py-1.5 rounded-sm cursor-grab hover:bg-[#F4F1EA] hover:border-[#1E392A] transition-colors flex items-center gap-2 shadow-sm"
            >
              <div className="w-8 h-10">
                 <StructureSVG rGroupSvg={aa.struct} groupColor="#eee" />
              </div>
              <span className="font-bold text-sm">{aa.kr}</span>
            </div>
          ))}
          {unplaced.length === 0 && <span className="text-gray-400 text-sm italic">모든 카드가 배치되었습니다. 채점하기를 누르세요.</span>}
        </div>
      </div>
    </div>
  );
}
