export interface Property {
    id: string;
    name: string;
    address: string;
    type: 'primary' | 'secondary' | 'rented';
    tenantName?: string;
    tenantPhone?: string;
    tenantEmail?: string;
    tenantNotes?: string;
    createdAt: string;
}

export interface BillHistoryEvent {
    date: string;
    action: 'created' | 'notified_whatsapp' | 'notified_email' | 'notified_sms' | 'marked_paid' | 'edited';
    note: string;
}

export interface MarketComparison {
    comparedAt: string;
    currentAnnualEstimate: number;
    bestOfferName: string;
    bestOfferCompany: string;
    bestOfferRate: string;
    estimatedAnnualSavings: number;
    estimatedMonthlySavings: number;
    reason: string;
    isBetter: boolean;
}

export interface UtilityBill {
    id: string;
    propertyId: string;
    supplyType: 'electricity' | 'gas' | 'water' | 'telecom' | 'other';
    companyName: string;
    billNumber: string;
    issueDate: string;
    periodStart?: string;
    periodEnd?: string;
    totalAmount: number;
    powerContractedKw?: number;
    energyConsumedKwh?: number;
    waterConsumedM3?: number;
    priceKwh?: number;
    fixedCharge?: number;
    cupsCode?: string;
    fileName?: string;
    fileType?: string;
    tenantStatus?: 'pending' | 'sent' | 'paid' | 'not_applicable';
    tenantPaidDate?: string;
    tenantNotes?: string;
    history: BillHistoryEvent[];
    marketAnalysis?: MarketComparison;
    createdAt: string;
}

const STORAGE_KEYS = {
    PROPERTIES: 'familyfi_properties_v1',
    BILLS: 'familyfi_utility_bills_v1'
};

const INITIAL_PROPERTIES: Property[] = [
    {
        id: 'prop-1',
        name: 'Vivienda Habitual',
        address: 'Calle Mayor 14, 3ºA, Madrid',
        type: 'primary',
        createdAt: new Date().toISOString()
    },
    {
        id: 'prop-2',
        name: 'Piso 2ºB Alquilado',
        address: 'Av. Diagonal 204, Barcelona',
        type: 'rented',
        tenantName: 'Carlos Mendoza',
        tenantPhone: '+34612345678',
        tenantEmail: 'carlos.mendoza@email.com',
        tenantNotes: 'Contrato hasta Julio 2027. Paga el día 5.',
        createdAt: new Date().toISOString()
    }
];

const INITIAL_BILLS: UtilityBill[] = [
    {
        id: 'bill-1',
        propertyId: 'prop-1',
        supplyType: 'electricity',
        companyName: 'Iberdrola',
        billNumber: 'IB-2026-9811',
        issueDate: '2026-10-15',
        periodStart: '2026-09-12',
        periodEnd: '2026-10-14',
        totalAmount: 78.45,
        powerContractedKw: 4.6,
        energyConsumedKwh: 342,
        priceKwh: 0.174,
        fixedCharge: 18.20,
        cupsCode: 'ES0021000001234567AB',
        fileName: 'factura_luz_octubre.pdf',
        fileType: 'application/pdf',
        tenantStatus: 'not_applicable',
        history: [
            { date: '2026-10-16 09:30', action: 'created', note: 'Factura escaneada y registrada' }
        ],
        marketAnalysis: {
            comparedAt: '2026-10-16 09:31',
            currentAnnualEstimate: 941.40,
            bestOfferName: 'Tarifa Relax Online',
            bestOfferCompany: 'Octopus Energy',
            bestOfferRate: '0.118 €/kWh + 0.082 €/kW/día',
            estimatedAnnualSavings: 184.20,
            estimatedMonthlySavings: 15.35,
            reason: 'Tu precio actual de 0.174 €/kWh supera la media de mercado (0.118 €/kWh). Con tu potencia y consumo, ahorrarías 184 €/año.',
            isBetter: true
        },
        createdAt: new Date().toISOString()
    },
    {
        id: 'bill-2',
        propertyId: 'prop-2',
        supplyType: 'electricity',
        companyName: 'Endesa',
        billNumber: 'END-77382',
        issueDate: '2026-10-18',
        periodStart: '2026-09-15',
        periodEnd: '2026-10-15',
        totalAmount: 54.30,
        powerContractedKw: 3.45,
        energyConsumedKwh: 215,
        priceKwh: 0.162,
        fixedCharge: 14.50,
        cupsCode: 'ES0031000009876543CD',
        fileName: 'endesa_piso2b_octubre.pdf',
        fileType: 'application/pdf',
        tenantStatus: 'pending',
        history: [
            { date: '2026-10-19 11:20', action: 'created', note: 'Factura subida desde móvil' }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: 'bill-3',
        propertyId: 'prop-1',
        supplyType: 'water',
        companyName: 'Canal Isabel II',
        billNumber: 'CYII-54312',
        issueDate: '2026-10-05',
        periodStart: '2026-08-01',
        periodEnd: '2026-09-30',
        totalAmount: 32.10,
        waterConsumedM3: 14,
        fileName: 'canal_isabel_ii_bimestral.pdf',
        fileType: 'application/pdf',
        tenantStatus: 'not_applicable',
        history: [
            { date: '2026-10-06 14:00', action: 'created', note: 'Registrado con foto de cámara' }
        ],
        createdAt: new Date().toISOString()
    }
];

export const UtilitiesStorage = {
    getProperties: (): Property[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
            if (!data) {
                localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(INITIAL_PROPERTIES));
                return INITIAL_PROPERTIES;
            }
            return JSON.parse(data);
        } catch {
            return INITIAL_PROPERTIES;
        }
    },

    saveProperties: (properties: Property[]): void => {
        try {
            localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
        } catch (e) {
            console.error('Error saving properties:', e);
        }
    },

    getBills: (): UtilityBill[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BILLS);
            if (!data) {
                localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
                return INITIAL_BILLS;
            }
            return JSON.parse(data);
        } catch {
            return INITIAL_BILLS;
        }
    },

    saveBills: (bills: UtilityBill[]): void => {
        try {
            localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
        } catch (e) {
            console.error('Error saving bills:', e);
        }
    },

    addBill: (bill: Omit<UtilityBill, 'id' | 'createdAt' | 'history'>): UtilityBill => {
        const bills = UtilitiesStorage.getBills();
        const newBill: UtilityBill = {
            ...bill,
            id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            createdAt: new Date().toISOString(),
            history: [
                {
                    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    action: 'created',
                    note: 'Factura registrada en el sistema'
                }
            ]
        };
        const updated = [newBill, ...bills];
        UtilitiesStorage.saveBills(updated);
        return newBill;
    },

    updateBillStatus: (
        billId: string, 
        status: 'pending' | 'sent' | 'paid', 
        actionNote: string,
        actionType: 'notified_whatsapp' | 'notified_email' | 'notified_sms' | 'marked_paid'
    ): UtilityBill | null => {
        const bills = UtilitiesStorage.getBills();
        const idx = bills.findIndex(b => b.id === billId);
        if (idx === -1) return null;

        const current = bills[idx];
        const newEvent: BillHistoryEvent = {
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            action: actionType,
            note: actionNote
        };

        const updatedBill: UtilityBill = {
            ...current,
            tenantStatus: status,
            tenantPaidDate: status === 'paid' ? (current.tenantPaidDate || new Date().toISOString().split('T')[0]) : current.tenantPaidDate,
            history: [newEvent, ...current.history]
        };

        bills[idx] = updatedBill;
        UtilitiesStorage.saveBills(bills);
        return updatedBill;
    },

    updateMarketAnalysis: (billId: string, analysis: MarketComparison): UtilityBill | null => {
        const bills = UtilitiesStorage.getBills();
        const idx = bills.findIndex(b => b.id === billId);
        if (idx === -1) return null;

        const updatedBill: UtilityBill = {
            ...bills[idx],
            marketAnalysis: analysis,
            history: [
                {
                    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    action: 'edited',
                    note: `Comparativa de mercado actualizada (${analysis.isBetter ? 'Ahorro detectado: ' + analysis.estimatedAnnualSavings + '€/año' : 'Tarifa óptima'})`
                },
                ...bills[idx].history
            ]
        };

        bills[idx] = updatedBill;
        UtilitiesStorage.saveBills(bills);
        return updatedBill;
    },

    deleteBill: (billId: string): void => {
        const bills = UtilitiesStorage.getBills().filter(b => b.id !== billId);
        UtilitiesStorage.saveBills(bills);
    },

    addProperty: (property: Omit<Property, 'id' | 'createdAt'>): Property => {
        const properties = UtilitiesStorage.getProperties();
        const newProperty: Property = {
            ...property,
            id: 'prop-' + Date.now(),
            createdAt: new Date().toISOString()
        };
        const updated = [...properties, newProperty];
        UtilitiesStorage.saveProperties(updated);
        return newProperty;
    },

    deleteProperty: (propertyId: string): void => {
        const properties = UtilitiesStorage.getProperties().filter(p => p.id !== propertyId);
        const bills = UtilitiesStorage.getBills().filter(b => b.propertyId !== propertyId);
        UtilitiesStorage.saveProperties(properties);
        UtilitiesStorage.saveBills(bills);
    }
};
