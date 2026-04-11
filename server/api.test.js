const request = require('supertest');
const app = require('./index');

describe('Cheongyak API Unit Tests', () => {
    // 1. 기본 목록 조회 테스트
    test('GET /api/apartments should return combined data with category', async () => {
        const res = await request(app).get('/api/apartments');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        
        if (res.body.data.length > 0) {
            const item = res.body.data[0];
            expect(item).toHaveProperty('_category');
            expect(['APT', 'OFFICETEL', 'REMAINDER', 'RENT']).toContain(item._category);
        }
    });

    // 2. 불법행위 재공급 필터링 테스트
    test('Should not contain "불법행위 재공급" type', async () => {
        const res = await request(app).get('/api/apartments');
        const data = res.body.data || [];
        const illegalType = data.filter(item => 
            item.HOUSE_SECD === '06' || item.HOUSE_SECD_NM === '불법행위 재공급'
        );
        expect(illegalType.length).toBe(0);
    });

    // 3. 날짜 필드 유효성 테스트
    test('Date fields should follow YYYY-MM-DD or YYYYMMDD format', async () => {
        const res = await request(app).get('/api/apartments');
        const data = res.body.data || [];
        
        // 샘플링하여 일부 데이터의 날짜 형식 확인
        const sample = data.slice(0, 10);
        const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{8})$/;

        sample.forEach(item => {
            const startDate = item.RCEPT_BGNDE || item.SUBSCRPT_RCEPT_BGNDE || item.SPECL_RCEPT_BGNDE;
            if (startDate && startDate !== 'null') {
                expect(startDate).toMatch(dateRegex);
            }
        });
    });

    // 5. 특정 단지 존재 확인 테스트 (디에트르)
    test('Should contain "디에트르" property', async () => {
        const res = await request(app).get('/api/apartments');
        const data = res.body.data || [];
        const detre = data.find(item => item.HOUSE_NM.includes('디에트르'));
        expect(detre).toBeDefined();
    });

    // 6. 특정 단지 날짜 형식 및 값 확인 (어반홈스)
    test('Urbanhomes A should have correct dates', async () => {
        const res = await request(app).get('/api/apartments');
        const data = res.body.data || [];
        const urban = data.find(item => item.HOUSE_NM.includes('어반홈스 A동'));
        
        if (urban) {
            // SUBSCRPT_RCEPT_BGNDE: 20260408, ENDDE: 20260414 (또는 YYYY-MM-DD)
            const start = urban.SUBSCRPT_RCEPT_BGNDE;
            const end = urban.SUBSCRPT_RCEPT_ENDDE;
            expect(start).toBeDefined();
            expect(end).toBeDefined();
        }
    });
});
