export interface Message {
    message_id: number
    from: From
    chat: Chat
    date: number
    text?: string
    caption?: string
    document?: Document
}

export interface From {
    id: number
    is_bot: boolean
    first_name: string
    language_code: string
}

export interface Chat {
    id: number
    first_name: string
    type: string
}

export interface Document {
    file_name: string
    mime_type: string
    file_id: string
    file_unique_id: string
    file_size: number
}

export interface DocumentInfo {
    file_path: string
    file_id: string
    file_unique_id: string
    file_size: number
}
