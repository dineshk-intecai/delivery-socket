import { partnerId } from "@/utils";

export const sendNotify = async (title: string, message: string) => {
    const apiUrl = process.env.EXPO_PUBLIC_ONESIGNAL_API;
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_ID;
    const apiKey = process.env.EXPO_PUBLIC_ONESIGNAL_API_KEY;

    const options = {
        method: 'POST',
        headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: `{
            "app_id": "${appId}",
            "include_aliases": {
                "external_id": ["${partnerId}"]
            },
            "headings": { "en": "${title}" },
            "contents": { "en": "${message}" },
            "target_channel": "push"
        }`
    };

    try {
        const response = await fetch(apiUrl, options);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}