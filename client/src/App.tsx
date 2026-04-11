import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Building2, Info, Loader2, ExternalLink, LayoutGrid, Map as MapIcon, ChevronLeft, Bell, Wallet, ChevronDown, ChevronUp, Users, Baby, AlertCircle } from 'lucide-react';
import './App.css';

interface CheongyakItem {
  HOUSE_NM: string;
  HSSPLY_ADRES: string;
  RCRIT_PBLANC_DE: string;
  PRZWNER_PRESNATN_DE: string;
  HOUSE_SECD_NM: string;
  RENT_SECD_NM: string;
  TOT_SUPLY_HSHLDCO: number;
  MVN_PREARNGE_YM: string;
  RCEPT_BGNDE: string;
  RCEPT_ENDDE: string;
  SPSPLY_RCEPT_BGNDE: string | null;
  SPSPLY_RCEPT_ENDDE: string | null;
  SUBSCRPT_RCEPT_BGNDE: string | null; // 오피스텔/무순위용
  SUBSCRPT_RCEPT_ENDDE: string | null; // 오피스텔/무순위용
  SPECL_RCEPT_BGNDE: string | null; // 민간임대용
  SPECL_RCEPT_ENDDE: string | null; // 민간임대용
  GNRL_RCEPT_BGNDE: string | null; // 민간임대용
  GNRL_RCEPT_ENDDE: string | null; // 민간임대용
  // 아파트 상세 일정 필드명 수정 (API 실제 응답 기준)
  GNRL_RNK1_CRSPAREA_RCPTDE: string | null;
  GNRL_RNK1_CRSPAREA_ENDDE: string | null;
  GNRL_RNK1_GG_RCPTDE: string | null;
  GNRL_RNK1_GG_ENDDE: string | null;
  GNRL_RNK1_ETC_AREA_RCPTDE: string | null;
  GNRL_RNK1_ETC_AREA_ENDDE: string | null;
  GNRL_RNK2_CRSPAREA_RCPTDE: string | null;
  GNRL_RNK2_CRSPAREA_ENDDE: string | null;
  GNRL_RNK2_GG_RCPTDE: string | null;
  GNRL_RNK2_GG_ENDDE: string | null;
  GNRL_RNK2_ETC_AREA_RCPTDE: string | null;
  GNRL_RNK2_ETC_AREA_ENDDE: string | null;
  BSNS_MBY_NM: string;
  CNSTRCT_ENTRPS_NM: string;
  PBLANC_URL: string;
  SUBSCRPT_AREA_CODE_NM: string;
  HOUSE_MANAGE_NO?: string;
  houseManageNo?: string;
  PBLANC_NO?: string;
  pblancNo?: string;
  _category?: string;
}

interface HouseDetail {
  HOUSE_TY: string;
  SUPLY_AR: string;
  LTTOT_TOP_AMOUNT: string;
  NWWDS_HSHLDCO: number | string;
  NWBB_HSHLDCO: number | string;
  HOUSE_MANAGE_NO?: string; // 응답 데이터 검증용
}

type ViewMode = 'list' | 'map';

const getApartmentKey = (item: CheongyakItem) => {
  const hNo = item.HOUSE_MANAGE_NO || item.houseManageNo;
  const pNo = item.PBLANC_NO || item.pblancNo;
  return hNo && pNo ? `${hNo}-${pNo}` : null;
};

const MAP_REGIONS = [
  { id: '경기', label: '경기', x: 130, y: 195, path: "M80,90 L140,80 L170,130 L160,230 L110,240 L70,160 Z" },
  { id: '인천', label: '인천', x: 65, y: 155, path: "M55,130 L85,125 L80,175 L50,170 Z" },
  { id: '강원', label: '강원', x: 220, y: 110, path: "M150,60 L260,50 L290,160 L220,220 L160,150 Z" },
  { id: '충북', label: '충북', x: 185, y: 255, path: "M175,160 L230,230 L210,300 L165,290 L160,220 Z" },
  { id: '충남', label: '충남', x: 80, y: 295, path: "M50,240 L150,240 L150,320 L95,360 L40,320 Z" },
  { id: '대전', label: '대전', x: 155, y: 315, path: "M145,290 L175,290 L175,335 L145,335 Z" },
  { id: '세종', label: '세종', x: 130, y: 275, path: "M120,255 L150,255 L150,290 L120,290 Z" },
  { id: '전북', label: '전북', x: 115, y: 395, path: "M75,330 L170,320 L190,410 L125,440 L65,410 Z" },
  { id: '전남', label: '전남', x: 95, y: 495, path: "M55,410 L140,430 L150,540 L45,540 L35,450 Z" },
  { id: '광주', label: '광주', x: 105, y: 455, path: "M95,435 L125,435 L125,475 L95,475 Z" },
  { id: '경북', label: '경북', x: 250, y: 305, path: "M220,225 L300,200 L320,380 L235,410 L205,310 Z" },
  { id: '경남', label: '경남', x: 215, y: 455, path: "M195,415 L285,415 L300,520 L175,540 L160,460 Z" },
  { id: '대구', label: '대구', x: 235, y: 375, path: "M220,350 L260,350 L260,400 L220,400 Z" },
  { id: '울산', label: '울산', x: 300, y: 425, path: "M285,405 L320,405 L320,450 L285,450 Z" },
  { id: '부산', label: '부산', x: 275, y: 495, path: "M255,475 L305,475 L305,525 L255,525 Z" },
  { id: '제주', label: '제주', x: 100, y: 590, path: "M60,570 Q100,560 140,570 T140,610 T60,610 Z" },
  { id: '서울', label: '서울', x: 105, y: 145, path: "M100,120 Q110,110 120,125 T130,145 T110,165 T90,150 Z" },
];

function App() {
  const [items, setItems] = useState<CheongyakItem[]>([]);
  const [details, setDetails] = useState<Record<string, HouseDetail[]>>({});
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const fetchDetails = async (item: CheongyakItem) => {
    const hNo = item.HOUSE_MANAGE_NO || item.houseManageNo;
    const pNo = item.PBLANC_NO || item.pblancNo;
    if (!hNo || !pNo) return;
    const key = `${hNo}-${pNo}`;
    try {
      const res = await axios.get(`http://${window.location.hostname}:5001/api/apartment-details/${hNo}/${pNo}`, {
        params: { category: item._category || 'APT' }
      });
      const resData = res.data.data || [];
      
      // 데이터 검증: 요청한 번호와 응답 데이터의 번호가 다르면 에러 표시
      if (resData.length > 0 && resData[0].HOUSE_MANAGE_NO !== hNo) {
        setDataErrors(prev => ({ ...prev, [key]: '정부 API 서버 데이터 불일치 오류' }));
      } else {
        setDetails(prev => ({ ...prev, [key]: resData }));
      }
    } catch (e) {}
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://${window.location.hostname}:5001/api/apartments`);
      const rawData = (response.data.data || []) as CheongyakItem[];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // 날짜 파싱 헬퍼 함수
      const parseDate = (d: string | null) => {
        if (!d || d === 'null' || d === '') return null;
        let formatted = d;
        if (d.length === 8 && !d.includes('-')) {
          formatted = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        }
        const time = new Date(formatted).getTime();
        return isNaN(time) ? null : time;
      };

      // 접수 종료된 공고 필터링 (가장 늦은 종료일 기준)
      const filteredData = rawData.filter(item => {
        const endDates = [
          item.RCEPT_ENDDE,
          item.SUBSCRPT_RCEPT_ENDDE,
          item.GNRL_RCEPT_ENDDE,
          item.SPECL_RCEPT_ENDDE,
          item.GNRL_RNK2_ETC_AREA_ENDDE,
          item.GNRL_RNK2_CRSPAREA_ENDDE
        ].map(d => parseDate(d)).filter(t => t !== null);

        if (endDates.length === 0) return true; // 종료일 정보 없으면 유지

        const maxEndTime = Math.max(...(endDates as number[]));
        return maxEndTime >= todayTime; // 오늘 포함 이후만 노출
      });

      const sortedData = [...filteredData].sort((a, b) => {
        // 우선순위 날짜 결정 (특별공급 -> 1순위 -> 2순위 -> 오피스텔 -> 임대)
        const dateAStr = a.SPSPLY_RCEPT_BGNDE || 
                         a.SPECL_RCEPT_BGNDE ||
                         a.GNRL_RNK1_CRSPAREA_RCPTDE || 
                         a.GNRL_RNK1_GG_RCPTDE || 
                         a.GNRL_RNK1_ETC_AREA_RCPTDE || 
                         a.SUBSCRPT_RCEPT_BGNDE ||
                         a.GNRL_RCEPT_BGNDE ||
                         a.RCEPT_BGNDE;
        const dateBStr = b.SPSPLY_RCEPT_BGNDE || 
                         b.SPECL_RCEPT_BGNDE ||
                         b.GNRL_RNK1_CRSPAREA_RCPTDE || 
                         b.GNRL_RNK1_GG_RCPTDE || 
                         b.GNRL_RNK1_ETC_AREA_RCPTDE || 
                         b.SUBSCRPT_RCEPT_BGNDE || 
                         b.GNRL_RCEPT_BGNDE ||
                         b.RCEPT_BGNDE;

        const dateA = parseDate(dateAStr) || 0;
        const dateB = parseDate(dateBStr) || 0;
        const diffA = dateA - todayTime;
        const diffB = dateB - todayTime;

        // 1. 미래 일정이 과거 일정보다 무조건 앞으로
        if (diffA >= 0 && diffB < 0) return -1;
        if (diffA < 0 && diffB >= 0) return 1;

        // 2. 둘 다 미래면 오늘과 가까운 순 (오름차순)
        if (diffA >= 0 && diffB >= 0) return diffA - diffB;

        // 3. 둘 다 과거면 최근 종료된 순 (내림차순)
        return diffB - diffA;
      });

      setItems(sortedData);
      sortedData.forEach((item: CheongyakItem) => fetchDetails(item));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => { counts[item.SUBSCRPT_AREA_CODE_NM] = (counts[item.SUBSCRPT_AREA_CODE_NM] || 0) + 1; });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!selectedRegion) return [];
    return items.filter(item => item.SUBSCRPT_AREA_CODE_NM === selectedRegion);
  }, [items, selectedRegion]);

  const toggleExpand = (key: string) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatPrice = (priceStr: string) => {
    let price = parseInt(priceStr.replace(/,/g, ''));
    if (isNaN(price)) return '정보없음';
    if (price < 10000000) {
      const uk = Math.floor(price / 10000);
      const man = price % 10000;
      if (uk > 0) return `${uk}억 ${man > 0 ? man.toLocaleString() + '만' : ''}`;
      return `${man.toLocaleString()}만원`;
    }
    const uk = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    if (uk > 0) return `${uk}억 ${man > 0 ? man.toLocaleString() + '만' : ''}`;
    return `${man.toLocaleString()}만원`;
  };

  const getDDay = (dateStr: string | null) => {
    if (!dateStr || dateStr === 'null' || dateStr === '') return null;
    
    // YYYYMMDD -> YYYY-MM-DD
    let formattedDate = dateStr;
    if (dateStr.length === 8 && !dateStr.includes('-')) {
      formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }

    const time = new Date(formattedDate).getTime();
    if (isNaN(time)) return null;

    const days = Math.ceil((time - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    if (days === 0) return <span className="d-day today">오늘 시작</span>;
    if (days > 0) return <span className="d-day future">D-{days}</span>;
    return <span className="d-day past">접수종료</span>;
  };

  const renderPriceTable = (item: CheongyakItem) => {
    const key = getApartmentKey(item);
    if (!key) return null;
    
    if (dataErrors[key]) {
      return (
        <div className="error-box">
          <AlertCircle size={16} />
          <span>{dataErrors[key]} (상세정보 제공 일시중단)</span>
        </div>
      );
    }

    const modelDetails = details[key];
    const isExpanded = expandedCards[key];

    if (!modelDetails) return <div className="loading-small">데이터 수신 중...</div>;
    if (modelDetails.length === 0) return <div className="loading-small">주택형 정보가 없습니다.</div>;

    const displayList = isExpanded === false ? modelDetails.slice(0, 3) : modelDetails;

    return (
      <div className="price-table-container">
        <div className="price-table-header">
          <span>주택형</span>
          <span>공급금액</span>
          <span>신혼/신생아</span>
        </div>
        {displayList.map((d: any, i) => {
          const area = parseFloat(d.SUPLY_AR);
          const pyeong = area / 3.3058;
          const houseType = d.HOUSE_TY || d.TP || '정보없음';
          const amountStr = d.LTTOT_TOP_AMOUNT || d.SUPLY_AMOUNT || '0';
          const rawPrice = parseInt(amountStr.replace(/,/g, ''));
          
          let pyeongPrice;
          if (rawPrice < 10000000) {
            pyeongPrice = Math.round(rawPrice / pyeong);
          } else {
            pyeongPrice = Math.round((rawPrice / pyeong) / 10000);
          }

          return (
            <div key={i} className="price-table-row">
              <div className="type-col">
                <span className="type-name">{houseType}</span>
                <span className="py-price">{pyeongPrice.toLocaleString()}만/평</span>
              </div>
              <span className="amount-col">{formatPrice(amountStr)}</span>
              <div className="supply-col">
                <div className="supply-badge newlyweds" title="신혼부부">
                  <Users size={10} /> {d.NWWDS_HSHLDCO || d.SPSPLY_NEW_MRRG_HSHLDCO || 0}
                </div>
                <div className="supply-badge newborn" title="신생아">
                  <Baby size={10} /> {d.NWBB_HSHLDCO || 0}
                </div>
              </div>
            </div>
          );
        })}
        {modelDetails.length > 3 && (
          <button className="expand-btn" onClick={(e) => { e.preventDefault(); toggleExpand(key); }}>
            {isExpanded === false ? <><ChevronDown size={14} /> 전체 {modelDetails.length}개 타입 보기</> : <><ChevronUp size={14} /> 접기</>}
          </button>
        )}
      </div>
    );
  };

  const renderCard = (item: CheongyakItem, idx: number) => {
    // 유효한 모든 접수일 수집 (민간임대/무순위 포함 + 수정된 필드명)
    const allDates = [
      item.SPSPLY_RCEPT_BGNDE,
      item.GNRL_RNK1_CRSPAREA_RCPTDE,
      item.GNRL_RNK1_GG_RCPTDE,
      item.GNRL_RNK1_ETC_AREA_RCPTDE,
      item.GNRL_RNK2_CRSPAREA_RCPTDE,
      item.GNRL_RNK2_GG_RCPTDE,
      item.GNRL_RNK2_ETC_AREA_RCPTDE,
      item.SUBSCRPT_RCEPT_BGNDE,
      item.SPECL_RCEPT_BGNDE,
      item.GNRL_RCEPT_BGNDE,
      item.RCEPT_BGNDE
    ].filter(d => d && d !== 'null' && d !== '');

    // 날짜 파싱 헬퍼 (로컬)
    const parseLocalDate = (d: string | null) => {
      if (!d || d === 'null' || d === '') return 0;
      let formatted = d;
      if (d.length === 8 && !d.includes('-')) {
        formatted = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      }
      const time = new Date(formatted).getTime();
      return isNaN(time) ? 0 : time;
    };

    // 오늘 이후 또는 오늘인 날짜 중 가장 빠른 날짜 찾기
    const todayTime = new Date().setHours(0,0,0,0);
    const upcomingDates = allDates
      .map(d => parseLocalDate(d))
      .filter(t => t >= todayTime)
      .sort((a, b) => a - b);

    // priorityDate 결정 (가장 가까운 미래 일정, 없으면 첫 번째 일정)
    let priorityDate = allDates[0];
    if (upcomingDates.length > 0) {
      const firstUpcoming = new Date(upcomingDates[0]);
      priorityDate = `${firstUpcoming.getFullYear()}-${String(firstUpcoming.getMonth() + 1).padStart(2, '0')}-${String(firstUpcoming.getDate()).padStart(2, '0')}`;
    }

    const getCategoryBadge = (cat?: string) => {
      switch(cat) {
        case 'APT': return <span className="badge">아파트</span>;
        case 'OFFICETEL': return <span className="badge warning">오피스텔/도시형</span>;
        case 'REMAINDER': return <span className="badge danger">무순위/임의</span>;
        case 'RENT': return <span className="badge info">민간임대</span>;
        default: return <span className="badge">{item.HOUSE_SECD_NM}</span>;
      }
    };

    return (
      <div key={idx} className="card">
        <div className="card-header">
          <div className="badge-group">
            {getCategoryBadge(item._category)}
            <span className="badge secondary">{item.RENT_SECD_NM}</span>
            {getDDay(priorityDate)}
          </div>
          <h3>{item.HOUSE_NM}</h3>
          <p className="constructor">시공: {item.CNSTRCT_ENTRPS_NM || '정보없음'}</p>
        </div>
        <div className="card-body">
          <div className="price-section">
            <div className="section-title"><Wallet size={16} /> 주택형별 공급가격 및 특공 정보</div>
            {renderPriceTable(item)}
          </div>
          <div className="info-item-group">
            <div className="info-item">
              <MapPin size={16} />
              <span style={{flex: 1}}>{item.HSSPLY_ADRES}</span>
              <a href={`https://map.naver.com/v5/search/${encodeURIComponent(item.HSSPLY_ADRES + ' ' + item.HOUSE_NM)}`} target="_blank" rel="noopener noreferrer" className="map-link"><ExternalLink size={12} /> 지도</a>
            </div>
            <div className="info-item">
              <Building2 size={16} />
              <span>총 {item.TOT_SUPLY_HSHLDCO}세대 / 입주: {item.MVN_PREARNGE_YM}</span>
            </div>
          </div>
          <div className="date-section">
            {/* 날짜 표시용 포맷팅 함수 */}
            {(() => {
              const formatDispDate = (d: string | null) => {
                if (!d) return '';
                if (d.length === 8 && !d.includes('-')) {
                  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
                }
                return d;
              };

              return (
                <>
                  {/* 아파트 특공 */}
                  {item.SPSPLY_RCEPT_BGNDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-orange" />
                      <span className="date-label">특별공급:</span>
                      <span>{formatDispDate(item.SPSPLY_RCEPT_BGNDE)}</span>
                    </div>
                  )}
                  
                  {/* 아파트 1순위 */}
                  {item.GNRL_RNK1_CRSPAREA_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-blue" />
                      <span className="date-label">1순위(해당):</span>
                      <span>{formatDispDate(item.GNRL_RNK1_CRSPAREA_RCPTDE)}</span>
                    </div>
                  )}
                  {item.GNRL_RNK1_GG_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-blue" />
                      <span className="date-label">1순위(경기):</span>
                      <span>{formatDispDate(item.GNRL_RNK1_GG_RCPTDE)}</span>
                    </div>
                  )}
                  {item.GNRL_RNK1_ETC_AREA_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-blue" />
                      <span className="date-label">1순위(기타):</span>
                      <span>{formatDispDate(item.GNRL_RNK1_ETC_AREA_RCPTDE)}</span>
                    </div>
                  )}

                  {/* 아파트 2순위 */}
                  {item.GNRL_RNK2_CRSPAREA_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-gray" />
                      <span className="date-label">2순위(해당):</span>
                      <span>{formatDispDate(item.GNRL_RNK2_CRSPAREA_RCPTDE)}</span>
                    </div>
                  )}
                  {item.GNRL_RNK2_GG_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-gray" />
                      <span className="date-label">2순위(경기):</span>
                      <span>{formatDispDate(item.GNRL_RNK2_GG_RCPTDE)}</span>
                    </div>
                  )}
                  {item.GNRL_RNK2_ETC_AREA_RCPTDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-gray" />
                      <span className="date-label">2순위(기타):</span>
                      <span>{formatDispDate(item.GNRL_RNK2_ETC_AREA_RCPTDE)}</span>
                    </div>
                  )}

                  {/* 민간임대 특공/일반 */}
                  {item.SPECL_RCEPT_BGNDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-orange" />
                      <span className="date-label">특별공급:</span>
                      <span>{formatDispDate(item.SPECL_RCEPT_BGNDE)}</span>
                    </div>
                  )}
                  {item.GNRL_RCEPT_BGNDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-blue" />
                      <span className="date-label">일반공급:</span>
                      <span>{formatDispDate(item.GNRL_RCEPT_BGNDE)}</span>
                    </div>
                  )}

                  {/* 오피스텔/무순위/임의공급 */}
                  {item.SUBSCRPT_RCEPT_BGNDE && (
                    <div className="info-item small">
                      <Calendar size={14} className="text-purple" />
                      <span className="date-label">청약접수:</span>
                      <span>{formatDispDate(item.SUBSCRPT_RCEPT_BGNDE)} ~ {formatDispDate(item.SUBSCRPT_RCEPT_ENDDE)}</span>
                    </div>
                  )}

                  {/* 공통 접수일 (아파트 상세 일정이 없을 때만 표시) */}
                  {!item.GNRL_RNK1_CRSPAREA_RCPTDE && !item.SPSPLY_RCEPT_BGNDE && !item.SPECL_RCEPT_BGNDE && !item.SUBSCRPT_RCEPT_BGNDE && item.RCEPT_BGNDE && (
                    <div className="info-item small">
                      <Calendar size={14} />
                      <span className="date-label">접수시작:</span>
                      <span>{formatDispDate(item.RCEPT_BGNDE)}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        <div className="card-footer">
          <a href={item.PBLANC_URL} target="_blank" rel="noopener noreferrer" className="details-btn">공고문 상세보기</a>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="main-header">
        <div className="header-content">
          <h1>🏢 청약 대시보드</h1>
          <p>실시간 분양가 및 지역별 현황</p>
        </div>
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>목록</button>
          <button className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>지도</button>
        </div>
      </header>
      <main>
        {loading ? (
          <div className="loader-container"><Loader2 className="spinner" size={48} /></div>
        ) : viewMode === 'map' && !selectedRegion ? (
          <div className="map-view-container">
            <div className="map-visual-wrapper">
              <svg viewBox="0 0 380 650" className="premium-map">
                {MAP_REGIONS.map(reg => (
                  <g key={reg.id} className={`region-group ${hoveredRegion === reg.id ? 'hover' : ''}`} onMouseEnter={() => setHoveredRegion(reg.id)} onMouseLeave={() => setHoveredRegion(null)} onClick={() => setSelectedRegion(reg.id)}>
                    <path d={reg.path} className="region-shape" fill={regionCounts[reg.id] ? "#dbeafe" : "#f8fafc"} />
                    <g className="label-group" transform={`translate(${reg.x}, ${reg.y})`}>
                      <circle r="18" className="label-circle" fill={regionCounts[reg.id] ? "#2563eb" : "#94a3b8"} />
                      <text y="-2" className="label-text" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">{reg.label}</text>
                      <text y="10" className="label-count" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">{regionCounts[reg.id] || 0}</text>
                    </g>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="list-view-container">
            {selectedRegion && (
              <button className="back-link" onClick={() => setSelectedRegion(null)}><ChevronLeft size={20} /> 지도로 돌아가기 ({selectedRegion})</button>
            )}
            <div className="grid">
              {(selectedRegion ? filteredItems : items).map((item, idx) => renderCard(item, idx))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
