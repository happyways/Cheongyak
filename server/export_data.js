require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api.odcloud.kr/api/ApplyHomeInfoDetailSvc/v1';
const SERVICE_KEY = process.env.SERVICE_KEY;

async function exportData() {
    console.log('🚀 데이터 추출을 시작합니다...');
    
    try {
        const params = { page: 1, perPage: 100, serviceKey: SERVICE_KEY };

        // 1. 목록 가져오기 (전체 카테고리)
        console.log('📦 목록 데이터 가져오는 중...');
        const [apt, ofc, rem, pvt] = await Promise.all([
            axios.get(`${API_BASE_URL}/getAPTLttotPblancDetail`, { params }),
            axios.get(`${API_BASE_URL}/getUrbtyOfctlLttotPblancDetail`, { params }),
            axios.get(`${API_BASE_URL}/getRemndrLttotPblancDetail`, { params }),
            axios.get(`${API_BASE_URL}/getPblPvtRentLttotPblancDetail`, { params })
        ]);

        const combinedData = [
            ...(apt.data.data || []).map(i => ({ ...i, _category: 'APT' })),
            ...(ofc.data.data || []).map(i => ({ ...i, _category: 'OFFICETEL' })),
            ...(rem.data.data || []).map(i => ({ ...i, _category: 'REMAINDER' })),
            ...(pvt.data.data || []).map(i => ({ ...i, _category: 'RENT' }))
        ].filter(item => item.HOUSE_SECD !== '06' && item.HOUSE_SECD_NM !== '불법행위 재공급');

        console.log(`✅ 총 ${combinedData.length}개의 공고를 찾았습니다.`);

        // 2. 상세 정보(금액 등) 미리 추출
        console.log('🔍 상세 데이터(금액 정보 등) 추출 중... (시간이 소요될 수 있습니다)');
        const details = {};
        
        // 병렬 호출 시 과부하 방지를 위해 순차 처리 또는 청크 처리
        for (const item of combinedData) {
            const hNo = item.HOUSE_MANAGE_NO || item.houseManageNo;
            const pNo = item.PBLANC_NO || item.pblancNo;
            const key = `${hNo}-${pNo}`;
            
            let endpoint = 'getAPTLttotPblancMdl';
            if (item._category === 'OFFICETEL') endpoint = 'getUrbtyOfctlLttotPblancMdl';
            else if (item._category === 'REMAINDER') endpoint = 'getRemndrLttotPblancMdl';
            else if (item._category === 'RENT') endpoint = 'getPblPvtRentLttotPblancMdl';

            try {
                const res = await axios.get(`${API_BASE_URL}/${endpoint}`, {
                    params: { 'cond[HOUSE_MANAGE_NO::EQ]': hNo, 'cond[PBLANC_NO::EQ]': pNo, serviceKey: SERVICE_KEY }
                });
                details[key] = res.data.data || [];
                process.stdout.write('.');
            } catch (e) {
                console.error(`\n❌ 상세 정보 로드 실패 (${key}):`, e.message);
            }
        }

        const finalData = {
            lastUpdated: new Date().toLocaleString('ko-KR'),
            items: combinedData,
            details: details
        };

        const outputPath = path.join(__dirname, '../client/public/static_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
        
        console.log(`\n\n🎉 저장 완료: ${outputPath}`);
        console.log('이제 GitHub에 Push하면 정적 데이터로 동작합니다.');

    } catch (error) {
        console.error('❌ 추출 실패:', error.message);
    }
}

exportData();
