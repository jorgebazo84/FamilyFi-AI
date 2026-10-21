import { GoogleGenAI } from "@google/genai";

export const NotificationService = {
    requestPermission: async () => {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        const permission = await Notification.requestPermission();
        return permission === "granted";
    },

    send: (title: string, body: string) => {
        if (Notification.permission === "granted") {
            new Notification(title, {
                body,
                icon: 'https://cdn-icons-png.flaticon.com/512/2845/2845895.png'
            });
        }
    },

    checkUpcomingExpenses: (settings: any) => {
        const rules = settings.recurrentIncomes || [];
        const now = new Date();
        const inThreeDays = new Date();
        inThreeDays.setDate(now.getDate() + 3);

        rules.forEach((rule: any) => {
            if (rule.type === 'expense') {
                const day = parseInt(rule.dayOfMonth);
                const expenseDate = new Date(now.getFullYear(), now.getMonth(), day);
                
                if (expenseDate >= now && expenseDate <= inThreeDays) {
                    const diffDays = Math.ceil((expenseDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                    const timeMsg = diffDays === 0 ? "hoy" : `en ${diffDays} días`;
                    
                    NotificationService.send(
                        "⚠️ Gasto Programado Próximo",
                        `Tu pago de "${rule.description}" por ${rule.amount}${settings.currency} se cargará ${timeMsg}.`
                    );
                }
            }
        });
    },

    // NUEVO: Detector de Anomalías con IA
    checkAnomaly: async (newTx: any, history: any[], settings: any): Promise<string | null> => {
        if (newTx.type !== 'expense') return null;

        const date = new Date(newTx.date);
        const dayOfWeek = date.getDay();
        const category = newTx.category;

        // 1. Filtrar historial por misma categoría y mismo día de la semana
        const peerTxs = history.filter(t => {
            const tDate = new Date(t.date);
            return t.category === category && t.type === 'expense' && tDate.getDay() === dayOfWeek && t.id !== newTx.id;
        });

        // Necesitamos al menos 2 registros previos para que la media tenga sentido
        if (peerTxs.length < 2) return null;

        const sum = peerTxs.reduce((acc, t) => acc + Number(t.amount), 0);
        const avg = sum / peerTxs.length;

        // 2. Si el nuevo gasto es > 200% de la media (doble)
        if (newTx.amount > avg * 2) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const days = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
                const dayName = days[dayOfWeek];

                const prompt = `Analiza este gasto inusual detectado por el sistema:
                - Gasto actual: ${newTx.amount}${settings.currency}
                - Categoría: ${category}
                - Concepto: ${newTx.description}
                - Día: ${dayName}
                - Media habitual para este día y categoría: ${avg.toFixed(2)}${settings.currency}
                
                Instrucción: Genera un aviso breve (máx 15 palabras) para el usuario. 
                Debe sonar inteligente, un poco sorprendido pero amigable. 
                Ejemplo: "¡Ojo! Hoy en Ocio has gastado el triple de lo normal para ser un martes."`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: { systemInstruction: "Eres el guardián financiero de FamilyFi-AI. Tu tono es perspicaz y directo." }
                });

                return response.text?.trim() || `Gasto inusual detectado en ${category}.`;
            } catch (e) {
                console.error("AI Anomaly Error:", e);
                return `El gasto en ${category} es significativamente superior a tu media de los ${new Date(newTx.date).toLocaleDateString('es-ES', {weekday: 'long'})}s.`;
            }
        }

        return null;
    }
};
