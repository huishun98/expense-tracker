import { extractExpenses } from "@/sheets/expenses";

const text = `
11 OctPrevious balance93.33
11 OctCredit Payment from Trust savings account +93.33
12 OctBus / MRT 3.20
14 Oct7-Eleven 2.30
16 Oct
WECHAT*TENCENT Shenzhen CN 
1 CNY = 0.1879 SGD
234.92 CNY44.15
17 OctBus / MRT 4.53
18 Oct
WECHAT*TENCENT Shenzhen CN 
1 CNY = 0.19 SGD
1.00 CNY0.19
19 OctBus / MRT 3.20
21 OctBus / MRT 3.89
25 OctCOMPOSE COFFE QLUB, SG SINGAPORE SG 20.00
26 OctJONGRO KELIM DAKDORITA SINGAPORE SG 68.97
26 OctBus / MRT 0.99
26 OctBus / MRT 0.99
27 OctBus / MRT 5.24
27 OctOld Tea Hut 2.00
28 OctBus / MRT 4.96
29 Oct7-Eleven 2.30
29 OctOld Tea Hut 2.00
30 OctBus / MRT 1.98
31 OctBus / MRT 5.36
02 NovBus / MRT 2.89
02 NovOld Tea Hut 1.60
04 NovSHEIN 43.59
01 JunPrevious balance223,204.80
02 JunRAZER MERCHANT SERVICES (SG) PTE. LTD.8.40
03 JunErica
+100,000.00
04 JunErica
+100,000.00
04 JunJoyce5,000.00
07 JunErica
+100,000.00
11 JunKimberly34.10
20 JunUBS AG SINGAPORE BRANCH
+7,387.00
20 JunJOYCE
+7.27
23 JunCredit card payment335.01
26 JunSudip Sikdar13.10
30 JunInterest
+1,148.18
`

describe('extractExpenses function', () => {
    it('should extract expenses from text', async () => {
        const results = await extractExpenses(text);
        expect(results).toHaveLength(33);
        expect(results).toStrictEqual(
            [
                ['11', 10, 'Credit Payment from Trust savings account', 0, 93.33],
                ['12', 10, 'Bus / MRT', 3.2, 0],
                ['14', 10, '7-Eleven', 2.3, 0],
                ['16', 10, 'WECHAT*TENCENT Shenzhen CN', 44.15, 0],
                ['17', 10, 'Bus / MRT', 4.53, 0],
                ['18', 10, 'WECHAT*TENCENT Shenzhen CN', 0.19, 0],
                ['19', 10, 'Bus / MRT', 3.2, 0],
                ['21', 10, 'Bus / MRT', 3.89, 0],
                ['25', 10, 'COMPOSE COFFE QLUB, SG SINGAPORE SG', 20, 0],
                ['26', 10, 'JONGRO KELIM DAKDORITA SINGAPORE SG', 68.97, 0],
                ['26', 10, 'Bus / MRT', 0.99, 0],
                ['26', 10, 'Bus / MRT', 0.99, 0],
                ['27', 10, 'Bus / MRT', 5.24, 0],
                ['27', 10, 'Old Tea Hut', 2, 0],
                ['28', 10, 'Bus / MRT', 4.96, 0],
                ['29', 10, '7-Eleven', 2.3, 0],
                ['29', 10, 'Old Tea Hut', 2, 0],
                ['30', 10, 'Bus / MRT', 1.98, 0],
                ['31', 10, 'Bus / MRT', 5.36, 0],
                ['02', 11, 'Bus / MRT', 2.89, 0],
                ['02', 11, 'Old Tea Hut', 1.6, 0],
                ['04', 11, 'SHEIN', 43.59, 0],
                ['02', 6, 'RAZER MERCHANT SERVICES (SG) PTE. LTD.', 8.4, 0],
                ['03', 6, 'Erica', 0, 100000],
                ['04', 6, 'Erica', 0, 100000],
                ['04', 6, 'Joyce', 5000, 0],
                ['07', 6, 'Erica', 0, 100000],
                ['11', 6, 'Kimberly', 34.1, 0],
                ['20', 6, 'UBS AG SINGAPORE BRANCH', 0, 7387],
                ['20', 6, 'JOYCE', 0, 7.27],
                ['23', 6, 'Credit card payment', 335.01, 0],
                ['26', 6, 'Sudip Sikdar', 13.1, 0],
                ['30', 6, 'Interest', 0, 1148.18]
            ]
        )
    });

    it('should handle empty input', async () => {
        const results = await extractExpenses('');
        expect(results).toHaveLength(0);
    });
});
