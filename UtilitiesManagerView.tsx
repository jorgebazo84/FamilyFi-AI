import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Home, 
    Plus, 
    Zap, 
    Flame, 
    Droplets, 
    Wifi, 
    TrendingDown, 
    Upload, 
    Camera, 
    FileText, 
    Sparkles, 
    Clock, 
    User, 
    MessageCircle, 
    CheckCircle2, 
    AlertTriangle, 
    Trash2, 
    ChevronRight, 
    ArrowLeft,
    RefreshCw,
    X,
    ExternalLink,
    HelpCircle
} from 'lucide-react';
import { 
    Property, 
    UtilityBill, 
    UtilitiesStorage, 
    MarketComparison 
} from "./utilitiesStorage.ts";
import { BillScannerModal } from "./BillScannerModal.tsx";
import { TenantNotifierModal } from "./TenantNotifierModal.tsx";
import { MarketComparatorEngine } from "./MarketComparatorEngine.ts";

interface UtilitiesManagerViewProps {
    setView: (view: string) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const UtilitiesManagerView: React.FC<UtilitiesManagerViewProps> = ({
    setView,
    showToast
}) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [bills, setBills] = useState<UtilityBill[]>([]);
    const [selectedSupplyFilter, setSelectedSupplyFilter] = useState<string>('all');
    
    // Modales
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedBillForTenant, setSelectedBillForTenant] = useState<UtilityBill | null>(null);
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
    const [reanalyzingBillId, setReanalyzingBillId] = useState<string | null>(null);

    // Formulario de Nuevo Inmueble
    const [newPropName, setNewPropName] = useState('');
    const [newPropAddress, setNewPropAddress] = useState('');
    const [newPropType, setNewPropType] = useState<'primary' | 'secondary' | 'rented'>('primary');
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantPhone, setNewTenantPhone] = useState('');
    const [newTenantEmail, setNewTenantEmail] = useState('');

    useEffect(() => {
        const loadedProps = UtilitiesStorage.getProperties();
        const loadedBills = UtilitiesStorage.getBills();
        setProperties(loadedProps);
        setBills(loadedBills);
        if (loadedProps.length > 0) {
            setSelectedPropertyId(prev => prev || loadedProps[0].id);
        }
    }, []);

    const loadData = () => {
        const loadedProps = UtilitiesStorage.getProperties();
        const loadedBills = UtilitiesStorage.getBills();
        setProperties(loadedProps);
        setBills(loadedBills);
        if (loadedProps.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(loadedProps[0].id);
        }
    };

    const currentProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

    const propertyBills = bills.filter(b => b.propertyId === currentProperty?.id);
    const filteredBills = selectedSupplyFilter === 'all' 
        ? propertyBills 
        : propertyBills.filter(b => b.supplyType === selectedSupplyFilter);

    // Cálculos de resumen
    const totalSpentInProperty = propertyBills.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalPotentialSavings = propertyBills.reduce((acc, b) => {
        return acc + (b.marketAnalysis?.isBetter ? (b.marketAnalysis.estimatedAnnualSavings || 0) : 0);
    }, 0);

    const pendingTenantBills = propertyBills.filter(b => b.tenantStatus === 'pending' || b.tenantStatus === 'sent');

    const handleCreateProperty = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropName.trim()) {
            showToast("Indica un nombre para el inmueble", "error");
            return;
        }

        const created = UtilitiesStorage.addProperty({
            name: newPropName.trim(),
            address: newPropAddress.trim() || 'Dirección no indicada',
            type: newPropType,
            tenantName: newPropType === 'rented' ? newTenantName.trim() : undefined,
            tenantPhone: newPropType === 'rented' ? newTenantPhone.trim() : undefined,
            tenantEmail: newPropType === 'rented' ? newTenantEmail.trim() : undefined
        });

        setProperties(UtilitiesStorage.getProperties());
        setSelectedPropertyId(created.id);
        setIsAddPropertyOpen(false);
        showToast("Inmueble añadido con éxito", "success");

        // Reset
        setNewPropName('');
        setNewPropAddress('');
        setNewTenantName('');
        setNewTenantPhone('');
        setNewTenantEmail('');
    };

    const handleDeleteBill = (billId: string) => {
        if (window.confirm("¿Seguro que deseas eliminar esta factura?")) {
            UtilitiesStorage.deleteBill(billId);
            setBills(UtilitiesStorage.getBills());
            showToast("Factura eliminada");
        }
    };

    const handleReanalyzeMarket = async (bill: UtilityBill) => {
        setReanalyzingBillId(bill.id);
        showToast("Consultando ofertas de mercado con Gemini IA...");
        try {
            const analysis = await MarketComparatorEngine.analyzeBill(bill);
            const updated = UtilitiesStorage.updateMarketAnalysis(bill.id, analysis);
            if (updated) {
                setBills(UtilitiesStorage.getBills());
                if (analysis.isBetter) {
                    showToast(`¡Ahorro detectado! Puedes ahorrar ${analysis.estimatedAnnualSavings}€/año con ${analysis.bestOfferCompany}`, "success");
                } else {
                    showToast("Tu tarifa actual ya es la más óptima del mercado", "success");
                }
            }
        } catch (e) {
            showToast("Error al reanalizar mercado", "error");
        } finally {
            setReanalyzingBillId(null);
        }
    };

    const getSupplyIcon = (type: string) => {
        switch (type) {
            case 'electricity': return <Zap size={18} className="text-amber-500" />;
            case 'gas': return <Flame size={18} className="text-red-500" />;
            case 'water': return <Droplets size={18} className="text-cyan-500" />;
            case 'telecom': return <Wifi size={18} className="text-indigo-500" />;
            default: return <Building2 size={18} className="text-slate-500" />;
        }
    };

    const getSupplyLabel = (type: string) => {
        switch (type) {
            case 'electricity': return 'Electricidad';
            case 'gas': return 'Gas Natural';
            case 'water': return 'Agua';
            case 'telecom': return 'Telecom';
            default: return 'Suministro';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pb-32 pt-4 px-4 sm:px-6 space-y-6">
            
            {/* Barra superior con volver y botón de acción */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setView('dashboard')}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
                >
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsAddPropertyOpen(true)}
                        className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-all"
                    >
                        <Plus size={16} /> Nueva Casa
                    </button>
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        <Sparkles size={16} className="text-cyan-400" /> Añadir Factura
                    </button>
                </div>
            </div>

            {/* Título de la Sección */}
            <div>
                <div className="flex items-center gap-2 text-cyan-600 mb-1">
                    <Building2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gestión Patrimonial & Suministros</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Facturas, Casas & Inquilinos</h2>
            </div>

            {/* Selector de Inmuebles (Pestañas horizontales estilo App Móvil) */}
            <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {properties.map(p => {
                    const isSelected = p.id === currentProperty?.id;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPropertyId(p.id)}
                            className={`px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0 transition-all ${
                                isSelected 
                                    ? 'bg-slate-900 text-white shadow-xl scale-102 ring-2 ring-cyan-500/50' 
                                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            <Home size={16} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                            <div className="text-left">
                                <p className="text-xs font-black leading-tight truncate max-w-[140px]">{p.name}</p>
                                <p className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-cyan-200' : 'text-slate-400'}`}>
                                    {p.type === 'rented' ? 'Alquilada' : p.type === 'primary' ? 'Habitual' : 'Segunda'}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Ficha Resumen del Inmueble Actual */}
            {currentProperty && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-cyan-300 border border-white/10">
                                {currentProperty.type === 'rented' ? 'Inmueble con Inquilino' : 'Vivienda Propia'}
                            </span>
                            <h3 className="text-2xl font-black mt-2 tracking-tight">{currentProperty.name}</h3>
                            <p className="text-xs text-slate-400 font-medium">{currentProperty.address}</p>
                        </div>

                        {currentProperty.type === 'rented' && currentProperty.tenantName && (
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-cyan-300">Inquilino</p>
                                <p className="text-xs font-black">{currentProperty.tenantName}</p>
                                <p className="text-[10px] text-slate-300">{currentProperty.tenantPhone || 'Sin teléfono'}</p>
                            </div>
                        )}
                    </div>

                    {/* Métricas Clave */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Facturas</p>
                            <p className="text-lg font-black text-white">{totalSpentInProperty.toFixed(2)} €</p>
                            <p className="text-[9px] text-slate-400 font-medium">{propertyBills.length} recibos subidos</p>
                        </div>

                        <div className="bg-cyan-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-400/30">
                            <p className="text-[8px] font-black text-cyan-300 uppercase tracking-widest">Ahorro IA Potencial</p>
                            <p className="text-lg font-black text-cyan-400">+{totalPotentialSavings.toFixed(2)} €/año</p>
                            <p className="text-[9px] text-cyan-200/80 font-medium">Comparado en mercado</p>
                        </div>

                        {currentProperty.type === 'rented' && (
                            <div className="col-span-2 sm:col-span-1 bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30">
                                <p className="text-[8px] font-black text-amber-300 uppercase tracking-widest">Cobros Pendientes</p>
                                <p className="text-lg font-black text-amber-400">{pendingTenantBills.length} por cobrar</p>
                                <p className="text-[9px] text-amber-200/80 font-medium">Repercutibles al inquilino</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Banner de Oportunidad de Ahorro con IA (Si hay ahorro detectado) */}
            {totalPotentialSavings > 0 && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/30 shadow-lg flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <TrendingDown size={24} />
                    </div>
                    <div className="flex-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Oportunidad de Ahorro Detectada
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                            Puedes ahorrar hasta {totalPotentialSavings.toFixed(2)} € al año en {currentProperty?.name}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                            La IA ha contrastado tus consumos de luz y suministros contra las tarifas públicas vigentes del mercado regulado y libre. Revisa las recomendaciones en cada factura.
                        </p>
                    </div>
                </div>
            )}

            {/* Filtros por Suministro */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Facturas Registradas</h3>
                
                <div className="flex gap-1.5 overflow-x-auto">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'electricity', label: 'Luz' },
                        { id: 'gas', label: 'Gas' },
                        { id: 'water', label: 'Agua' },
                        { id: 'telecom', label: 'Fibra' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedSupplyFilter(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                selectedSupplyFilter === f.id 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Facturas del Inmueble */}
            <div className="space-y-4">
                {filteredBills.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-8 text-center border border-dashed border-slate-200">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <FileText size={24} />
                        </div>
                        <h4 className="font-black text-slate-800 text-base mb-1">No hay facturas registradas</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                            Sube un PDF o haz una foto de tu factura de luz, agua, gas o teléfono para empezar las comparativas.
                        </p>
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                        >
                            <Upload size={16} /> Subir Mi Primera Factura
                        </button>
                    </div>
                ) : (
                    filteredBills.map(bill => {
                        const isReanalyzing = reanalyzingBillId === bill.id;
                        return (
                            <div 
                                key={bill.id}
                                className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all space-y-4"
                            >
                                {/* Cabecera de la Factura */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                                            {getSupplyIcon(bill.supplyType)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-900 text-base">{bill.companyName}</h4>
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {getSupplyLabel(bill.supplyType)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                N.º {bill.billNumber} • {bill.issueDate}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-xl font-black text-slate-900">{bill.totalAmount.toFixed(2)} €</span>
                                        {bill.periodStart && bill.periodEnd && (
                                            <p className="text-[9px] text-slate-400 font-medium">{bill.periodStart} al {bill.periodEnd}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Parámetros Técnicos Clave */}
                                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600 bg-slate-50/80 p-3 rounded-2xl">
                                    {bill.powerContractedKw && (
                                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/60">
                                            ⚡ Potencia: {bill.powerContractedKw} kW
                                        </span>
                                    )}
                                    {bill.energyConsumedKwh && (
                                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/60">
                                            🔋 Consumo: {bill.energyConsumedKwh} kWh
                                        </span>
                                    )}
                                    {bill.priceKwh && (
                                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/60">
                                            💶 Precio: {bill.priceKwh} €/kWh
                                        </span>
                                    )}
                                    {bill.waterConsumedM3 && (
                                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/60">
                                            💧 Consumo: {bill.waterConsumedM3} m³
                                        </span>
                                    )}
                                    {bill.cupsCode && (
                                        <span className="bg-white px-2.5 py-1 rounded-xl border border-slate-200/60 text-[10px] text-slate-400 truncate max-w-[180px]">
                                            CUPS: {bill.cupsCode}
                                        </span>
                                    )}
                                </div>

                                {/* Comparativa de Mercado con IA */}
                                {bill.marketAnalysis && (
                                    <div className={`p-4 rounded-2xl border text-xs ${
                                        bill.marketAnalysis.isBetter 
                                            ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-950' 
                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}>
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles size={14} className={bill.marketAnalysis.isBetter ? "text-emerald-600" : "text-slate-400"} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    {bill.marketAnalysis.isBetter ? 'Oferta de Mercado Recomendada' : 'Tarifa Actual Competitiva'}
                                                </span>
                                            </div>

                                            {bill.marketAnalysis.isBetter && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                                                    Ahorra {bill.marketAnalysis.estimatedAnnualSavings} €/año
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-black text-sm">
                                            {bill.marketAnalysis.bestOfferCompany} • {bill.marketAnalysis.bestOfferName}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-mono mb-2">
                                            {bill.marketAnalysis.bestOfferRate}
                                        </p>
                                        <p className="text-[11px] font-medium leading-relaxed">
                                            {bill.marketAnalysis.reason}
                                        </p>
                                    </div>
                                )}

                                {/* Barra de Acciones y Gestión de Inquilino */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        {/* Botón Reanalizar Mercado con IA */}
                                        <button
                                            type="button"
                                            disabled={isReanalyzing}
                                            onClick={() => handleReanalyzeMarket(bill)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <RefreshCw size={13} className={isReanalyzing ? 'animate-spin text-cyan-600' : ''} />
                                            {isReanalyzing ? 'Auditando...' : 'Reauditar Mercado'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBill(bill.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                            title="Eliminar factura"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    {/* Si el inmueble está alquilado: Botón de Notificar Inquilino / Cobro */}
                                    {currentProperty?.type === 'rented' && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBillForTenant(bill)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all ${
                                                bill.tenantStatus === 'paid' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : bill.tenantStatus === 'sent'
                                                    ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                                                    : 'bg-emerald-600 text-white shadow-emerald-600/20'
                                            }`}
                                        >
                                            <MessageCircle size={14} />
                                            {bill.tenantStatus === 'paid' ? 'Cobrada al Inquilino' 
                                                : bill.tenantStatus === 'sent' ? 'Recordar / Ver Cobro' 
                                                : 'Repercutir a Inquilino'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Escaneo y Carga de Facturas (Móvil / Desktop) */}
            <BillScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                properties={properties}
                selectedPropertyId={currentProperty?.id}
                onBillSaved={(saved) => {
                    setBills(UtilitiesStorage.getBills());
                }}
                showToast={showToast}
            />

            {/* Modal de Notificación y Gestión de Inquilino */}
            <TenantNotifierModal 
                isOpen={!!selectedBillForTenant}
                onClose={() => setSelectedBillForTenant(null)}
                bill={selectedBillForTenant}
                property={currentProperty}
                onBillUpdated={(updated) => {
                    setBills(UtilitiesStorage.getBills());
                    setSelectedBillForTenant(updated);
                }}
                showToast={showToast}
            />

            {/* Modal para Crear Nuevo Inmueble */}
            {isAddPropertyOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-black text-slate-900 text-lg">Añadir Inmueble</h3>
                            <button onClick={() => setIsAddPropertyOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProperty} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre o Alias</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Apartamento Playa, Piso 2ºB..."
                                    value={newPropName}
                                    onChange={(e) => setNewPropName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección (Opcional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Calle, número, ciudad..."
                                    value={newPropAddress}
                                    onChange={(e) => setNewPropAddress(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso del Inmueble</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'primary', label: 'Habitual' },
                                        { id: 'secondary', label: 'Segunda Res.' },
                                        { id: 'rented', label: 'Alquilada' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setNewPropType(t.id as any)}
                                            className={`py-2 rounded-xl text-xs font-black transition-all ${
                                                newPropType === t.id 
                                                    ? 'bg-slate-900 text-white shadow-sm' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Si es alquilada, pedir datos del inquilino */}
                            {newPropType === 'rented' && (
                                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">
                                        Datos del Inquilino para Avisos
                                    </p>
                                    <input 
                                        type="text" 
                                        placeholder="Nombre del inquilino"
                                        value={newTenantName}
                                        onChange={(e) => setNewTenantName(e.target.value)}
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                    <input 
                                        type="tel" 
                                        placeholder="Teléfono móvil para WhatsApp (+34...)"
                                        value={newTenantPhone}
                                        onChange={(e) => setNewTenantPhone(e.target.value)}
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-mono"
                                    />
                                    <input 
                                        type="email" 
                                        placeholder="Correo electrónico"
                                        value={newTenantEmail}
                                        onChange={(e) => setNewTenantEmail(e.target.value)}
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                >
                                    Guardar Inmueble
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
