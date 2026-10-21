import React, { useState } from 'react';
import { 
    X, 
    Send, 
    MessageCircle, 
    Mail, 
    Smartphone, 
    CheckCircle2, 
    Copy, 
    Check, 
    Clock, 
    User, 
    Calendar, 
    FileText 
} from 'lucide-react';
import { UtilityBill, Property, UtilitiesStorage } from "./utilitiesStorage.ts";

interface TenantNotifierModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: UtilityBill | null;
    property: Property | null;
    onBillUpdated: (updatedBill: UtilityBill) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const TenantNotifierModal: React.FC<TenantNotifierModalProps> = ({
    isOpen,
    onClose,
    bill,
    property,
    onBillUpdated,
    showToast
}) => {
    const [copied, setCopied] = useState(false);
    const [paymentNote, setPaymentNote] = useState('');
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    if (!isOpen || !bill || !property) return null;

    const tenantName = property.tenantName || 'Inquilino';
    const tenantPhone = property.tenantPhone || '';
    const tenantEmail = property.tenantEmail || '';

    // Preparar mensaje personalizado profesional para WhatsApp y Email
    const supplyLabel = bill.supplyType === 'electricity' ? 'Electricidad / Luz' 
        : bill.supplyType === 'gas' ? 'Gas Natural' 
        : bill.supplyType === 'water' ? 'Agua' 
        : bill.supplyType === 'telecom' ? 'Fibra / Internet' 
        : 'Suministros';

    const periodText = bill.periodStart && bill.periodEnd 
        ? ` (${bill.periodStart} al ${bill.periodEnd})` 
        : ` de fecha ${bill.issueDate}`;

    const messageTemplate = `Hola ${tenantName}, te comparto el desglose de la factura de ${supplyLabel}${periodText} correspondiente a la vivienda en ${property.name}.\n\n` +
        `• Compañía: ${bill.companyName}\n` +
        `• N.º Factura: ${bill.billNumber}\n` +
        (bill.energyConsumedKwh ? `• Consumo: ${bill.energyConsumedKwh} kWh\n` : '') +
        (bill.waterConsumedM3 ? `• Consumo: ${bill.waterConsumedM3} m³\n` : '') +
        `• Importe a abonar: ${bill.totalAmount.toFixed(2)} €\n\n` +
        `Por favor, cuando realices la transferencia confirma por esta vía adjuntando el justificante. ¡Muchas gracias!`;

    const cleanPhone = tenantPhone.replace(/[^0-9]/g, '');

    const handleWhatsApp = () => {
        if (!cleanPhone) {
            showToast("El inquilino no tiene teléfono configurado", "error");
            return;
        }

        const encodedMsg = encodeURIComponent(messageTemplate);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
        
        // Registrar interacción en historial
        const note = `Aviso enviado por WhatsApp a ${tenantName} (${tenantPhone})`;
        const updated = UtilitiesStorage.updateBillStatus(bill.id, 'sent', note, 'notified_whatsapp');
        if (updated) onBillUpdated(updated);

        window.open(waUrl, '_blank');
        showToast("Abriendo WhatsApp y registrando notificación", "success");
    };

    const handleEmail = () => {
        if (!tenantEmail) {
            showToast("El inquilino no tiene email configurado", "error");
            return;
        }

        const subject = encodeURIComponent(`Factura de ${supplyLabel} - ${property.name}`);
        const body = encodeURIComponent(messageTemplate);
        const mailtoUrl = `mailto:${tenantEmail}?subject=${subject}&body=${body}`;

        const note = `Aviso enviado por Correo Electrónico a ${tenantName} (${tenantEmail})`;
        const updated = UtilitiesStorage.updateBillStatus(bill.id, 'sent', note, 'notified_email');
        if (updated) onBillUpdated(updated);

        window.location.href = mailtoUrl;
        showToast("Abriendo cliente de correo", "success");
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(messageTemplate);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        showToast("Mensaje copiado al portapapeles", "success");
    };

    const handleMarkAsPaid = () => {
        const note = `Pago de ${bill.totalAmount.toFixed(2)} € confirmado por el propietario${paymentNote ? ': ' + paymentNote : ''}`;
        const updated = UtilitiesStorage.updateBillStatus(bill.id, 'paid', note, 'marked_paid');
        if (updated) {
            onBillUpdated(updated);
            showToast("Factura marcada como cobrada", "success");
            setIsMarkingPaid(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <Send size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight">
                                Gestión de Inquilino
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {property.name} • {tenantName}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Tarjeta Resumen de la Factura a Cobrar */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-white flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">
                                Factura a Repercutir
                            </p>
                            <h4 className="text-xl font-black">{supplyLabel}</h4>
                            <p className="text-xs text-slate-400 font-medium">{bill.companyName} • {bill.issueDate}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Importe</p>
                            <span className="text-2xl font-black text-white">{bill.totalAmount.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* Estado Actual */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2.5">
                            <Clock size={16} className="text-slate-500" />
                            <span className="text-xs font-black text-slate-700">Estado de Cobro:</span>
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            bill.tenantStatus === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : bill.tenantStatus === 'sent'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                            {bill.tenantStatus === 'paid' ? 'Pagada / Reembolsada' 
                                : bill.tenantStatus === 'sent' ? 'Notificada (Esperando Pago)' 
                                : 'Pendiente de Notificar'}
                        </span>
                    </div>

                    {/* Canales de Notificación Inmediatos */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Enviar Notificación al Inquilino
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {/* WhatsApp Directo */}
                            <button
                                type="button"
                                onClick={handleWhatsApp}
                                className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                            >
                                <MessageCircle size={18} />
                                WhatsApp Directo
                            </button>

                            {/* Email */}
                            <button
                                type="button"
                                onClick={handleEmail}
                                className="p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                            >
                                <Mail size={18} />
                                Enviar Correo
                            </button>
                        </div>
                    </div>

                    {/* Vista Previa del Mensaje y Copiar */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Vista Previa del Mensaje
                            </label>
                            <button 
                                type="button"
                                onClick={handleCopyMessage}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider"
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copiado' : 'Copiar Texto'}
                            </button>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                            {messageTemplate}
                        </div>
                    </div>

                    {/* Marcar como Cobrada */}
                    <div className="pt-2 border-t border-slate-100">
                        {!isMarkingPaid ? (
                            <button
                                type="button"
                                onClick={() => setIsMarkingPaid(true)}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    bill.tenantStatus === 'paid' 
                                        ? 'bg-slate-100 text-slate-400 cursor-default'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                                }`}
                            >
                                <CheckCircle2 size={18} />
                                {bill.tenantStatus === 'paid' ? 'Factura ya Cobrada' : 'Marcar Factura como Pagada'}
                            </button>
                        ) : (
                            <div className="space-y-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl animate-in fade-in">
                                <p className="text-xs font-black text-emerald-900">
                                    Confirmar Cobro de {bill.totalAmount.toFixed(2)} €
                                </p>
                                <input 
                                    type="text" 
                                    placeholder="Nota opcional (ej: Bizum recibido, ref transferencia...)"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsMarkingPaid(false)}
                                        className="w-1/3 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleMarkAsPaid}
                                        className="w-2/3 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
                                    >
                                        Confirmar Cobro
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historial de Interacciones / Trazabilidad */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Historial y Trazabilidad de Acciones
                        </label>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                            {bill.history.map((h, i) => (
                                <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800">{h.note}</p>
                                        <p className="text-[9px] font-medium text-slate-400">{h.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
