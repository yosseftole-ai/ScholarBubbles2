export default async function handler(req, res) {
    // וידוא שהבקשה היא מסוג POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // משיכת המפתח מהמשתנה שהגדרת ב-Vercel בשם "api"
    const apiKey = process.env.api;

    if (!apiKey) {
        return res.status(500).json({ error: 'חסר מפתח API בהגדרות השרת (Environment Variables)' });
    }

    const { messages, systemPrompt, withSearch } = req.body;

    try {
        // המרת ההודעות מהפורמט של האתר לפורמט של גוגל
        const contents = messages.map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

        const payload = {
            contents: contents,
            systemInstruction: { parts: [{ text: systemPrompt || "אתה עוזר אקדמי חכם." }] }
        };

        // הוספת כלי חיפוש אם נדרש
        if (withSearch) {
            payload.tools = [{ google_search: {} }];
        }

        // שימוש במודל יציב ומהיר (1.5 Flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Google API Error:", data.error);
            throw new Error(data.error.message);
        }

        let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא התקבלה תשובה.";
        
        // טיפול במקורות מידע (Grounding) אם יש
        const grounding = data.candidates?.[0]?.groundingMetadata?.groundingAttributions;
        if (grounding) {
            aiText += "\n\nמקורות שמצאתי:\n";
            grounding.forEach(g => {
                if (g.web?.uri && g.web?.title) {
                    aiText += `• [${g.web.title}](${g.web.uri})\n`;
                }
            });
        }

        res.status(200).json({ text: aiText });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "שגיאת שרת: " + error.message });
    }
}
