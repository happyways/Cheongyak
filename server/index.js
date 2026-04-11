require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const API_BASE_URL = 'https://api.odcloud.kr/api/ApplyHomeInfoDetailSvc/v1';

app.get('/api/apartments', async (req, res) => {
    try {
        const { page = 1, perPage = 100 } = req.query; // 기본 100개로 상향
        const params = { page, perPage, serviceKey: process.env.SERVICE_KEY };

        // 1. 아파트 분양공고
        const aptRes = await axios.get(`${API_BASE_URL}/getAPTLttotPblancDetail`, { params });
        const aptData = (aptRes.data.data || []).map(item => ({ ...item, _category: 'APT' }));

        // 2. 오피스텔/도시형/생활숙박시설
        const ofcRes = await axios.get(`${API_BASE_URL}/getUrbtyOfctlLttotPblancDetail`, { params });
        const ofcData = (ofcRes.data.data || []).map(item => ({ ...item, _category: 'OFFICETEL' }));

        // 3. 무순위/임의공급
        const remRes = await axios.get(`${API_BASE_URL}/getRemndrLttotPblancDetail`, { params });
        const remData = (remRes.data.data || []).map(item => ({ ...item, _category: 'REMAINDER' }));

        // 4. 공공지원 민간임대
        const pvtRes = await axios.get(`${API_BASE_URL}/getPblPvtRentLttotPblancDetail`, { params });
        const pvtData = (pvtRes.data.data || []).map(item => ({ ...item, _category: 'RENT' }));

        // 데이터 통합 및 필터링 (불법행위 재공급 제외)
        const combinedData = [...aptData, ...ofcData, ...remData, ...pvtData].filter(item => 
            item.HOUSE_SECD !== '06' && item.HOUSE_SECD_NM !== '불법행위 재공급'
        );
        
        res.json({ data: combinedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '데이터 호출 실패' });
    }
});

app.get('/api/test-raw', async (req, res) => {
    try {
        const endpoints = [
            'getAPTLttotPblancDetail',
            'getUrbtyOfctlLttotPblancDetail',
            'getRemndrLttotPblancDetail',
            'getPblPvtRentLttotPblancDetail'
        ];
        
        let allResults = [];
        for (const endpoint of endpoints) {
            const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
                params: { page: 1, perPage: 100, serviceKey: process.env.SERVICE_KEY }
            });
            const data = response.data.data || [];
            const matches = data.filter(item => item.HOUSE_NM.includes('어반홈스'));
            allResults = [...allResults, ...matches];
        }
        res.json(allResults);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 주택형별 상세정보 (면적, 분양가 등) - 카테고리별 분기 처리
app.get('/api/apartment-details/:houseNo/:pblancNo', async (req, res) => {
    const { category = 'APT' } = req.query;
    try {
        const { houseNo, pblancNo } = req.params;
        
        let endpoint = 'getAPTLttotPblancMdl'; // 기본값 (아파트)
        
        if (category === 'OFFICETEL') {
            endpoint = 'getUrbtyOfctlLttotPblancMdl';
        } else if (category === 'REMAINDER') {
            endpoint = 'getRemndrLttotPblancMdl';
        } else if (category === 'RENT') {
            endpoint = 'getPblPvtRentLttotPblancMdl';
        }

        const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
            params: {
                'cond[HOUSE_MANAGE_NO::EQ]': houseNo,
                'cond[PBLANC_NO::EQ]': pblancNo,
                serviceKey: process.env.SERVICE_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Detail fetch error (${category}):`, error.message);
        res.status(500).json({ error: '상세 정보 호출 실패' });
    }
});

// 다른 API들은 기존 Applyhome 서비스 규격을 따를 가능성이 높으므로 유지하거나
// 필요 시 사용자가 추가 정보를 주면 수정 가능합니다.
app.get('/api/officetels', async (req, res) => {
    // 임시로 빈 데이터 반환 (신청 정보가 없으므로)
    res.json({ data: [] });
});

app.get('/api/reminders', async (req, res) => {
    res.json({ data: [] });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} (External access enabled)`);
    });
}

module.exports = app;
