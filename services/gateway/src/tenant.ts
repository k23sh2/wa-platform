// WhatsApp phone_number_id → tenantId 매핑
const MAP: Record<string, string> = {
    "879105141951692": "demo-tenant", // 필요에 따라 수정
};

export function resolveTenant(phoneNumberId: string, fallback: string) {
    return MAP[phoneNumberId] ?? fallback;
}
