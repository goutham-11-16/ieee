export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'event_admin' | 'finance_admin' | 'content_admin' | 'participant'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalActionType =
    | 'PUBLISH_EVENT'
    | 'LOCK_TEMPLATE'
    | 'GENERATE_CERTIFICATES'
    | 'FINALIZE_ATTENDANCE'
    | 'EXTEND_DEADLINE'
    | 'UPDATE_DATA'
    | 'DELETE_DATA';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    created_at: string;
}

export interface Event {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    date: string;
    registration_start: string | null;
    registration_end: string | null;
    fees: number;
    coordinators: any[]; // JSONB
    location: string | null;
    banner_url: string | null;
    max_capacity: number | null;
    requires_approval: boolean;
    is_published: boolean;
    created_by: string;
    created_at: string;
}

export type RegistrationStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface Registration {
    id: string;
    user_id: string;
    event_id: string;
    status: RegistrationStatus;
    ticket_qr_uuid: string;
    created_at: string;
}

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'verified' | 'rejected' | 'refunded';

export interface Payment {
    id: string;
    registration_id: string;
    amount: number;
    currency: string;
    transaction_reference: string | null;
    proof_url: string | null;
    receipt_url: string | null;
    status: PaymentStatus;
    verified_by: string | null;
    verified_at: string | null;
    created_at: string;
}
