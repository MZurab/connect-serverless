export type RequestInputType  = {
    instanceId: string,
    messages: {
        author: string,
        body: string,
        chatId: string,
        fromMe: boolean,
        id: string,
        messageNumber: number,
        senderName: string,
        time: number,
        type: string
    }[]
}