// api/chat.js
export default async function handler(req, res) {
    // הגדרות אבטחה (CORS) - מאפשר לאתר שלך לגשת לשרת
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // טיפול בבקשות Preflight (לדפדפנים)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { prompt } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; // המפתח יישמר בהגדרות של Vercel
    
    // שימוש בגרסה 2.0 פלאש (הכי קרוב ל-2.5 שביקשת ויציב מאוד)
    const MODEL_NAME = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("שגיאה מגוגל:", data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        // שליחת התשובה חזרה לאתר שלך
        const aiResponse = data.candidates[0].content.parts[0].text;
        res.status(200).json({ text: aiResponse });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "שגיאה בשרת המתווך" });
    }
}
