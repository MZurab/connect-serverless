import {Callback, Context, Handler} from "aws-lambda";
import {Connect} from "../../../input/connect";
import {RequestInputType} from "./res/@library/whatsapp-chat-api-com-provider/res/@type/@request-input/request-input.type";
import {WhatsappChatApiComProvider} from "./res/@library/whatsapp-chat-api-com-provider";


// function safeGetPhone (phones: string | number) {
//     phones = phones + '';
//     //
//     let phonesArray = phones.replace(/[^0-9\,]/g,'').split(',') || [],
//         r = []
//
//     for (let phone of phonesArray) {
//         if (phone.length > 10) {
//             // @ts-ignore
//             r.push(`7${phone.slice(1)}`);
//         } else {
//             // @ts-ignore
//             r.push(phone.slice(1));
//
//         }
//         phone.slice(1)
//     }
//
//     return r;
//
// }

const handler: Handler = (event: any, context: Context, callback: Callback) => {
    // set header
    Connect.setHeader(event);



    const   BODY: RequestInputType  = Connect.getBody(),
            params  = Connect.getQueryString(),
            msgType = params && params['type'];

    console.log('BODY', JSON.stringify(BODY));
    console.log('params', JSON.stringify(params));
    console.log('msgType', msgType);

    if (
        // msgType === 'inputMessageFromTelegramApp' &&
        ( // is message
            BODY &&
            Array.isArray(BODY.messages) &&
            BODY.messages.length > 0
        )
    ) {
        // we have message input messages -> check message it's from me or to me
        let messages = BODY.messages;

        console.log('INPUT-MESSAGE 0', JSON.stringify(messages));

        for (let message of messages) {
            console.log('INPUT-MESSAGE 1', message);

            //@guard - message send to me and it's not group chat
            if (message.fromMe || message.chatId !== message.author) break;


            console.log('INPUT-MESSAGE 2', message);


            //get
            let content = message.body,
                isJoin  = content.toLowerCase().indexOf('подкл')!== -1,
                isHello = content.toLowerCase().indexOf('прив')!== -1,
                isActiv = content.toLowerCase().indexOf('актив') !== -1;

            if ( !isJoin && !isHello && !isActiv) {
                return;
            }

            let promiseAll = [],
                matchAuthor  = message.author.match(/[0-9]+/g),
                match   = ((isJoin || isActiv) && !isHello) ? content.replace(/[^0-9]/g,'').match(/[0-9]+/g) : message.author.match(/[0-9]+/g),
                phone   = (match && match[0]) || '',
                author = (matchAuthor && matchAuthor[0]) || '';


            console.log('INPUT-MESSAGE 4  phone, phone.length', phone, phone.length, author);

            if (
                phone.length === 11
            ) {
                if (isJoin || isHello) {
                    // подключить сообщение
                    // @ts-ignore
                    promiseAll.push(WhatsappChatApiComProvider.sendTo1dnevnikForActiveToWhatsappInput(phone, author).toPromise());
                } else if (isActiv) {
                    let msgToAuthor = `Номер ${phone} отправлен на возможность добавления. Спасибо.`,
                        msg = 'Уважаемый родитель! Вам будут приходить оценки Ваших детей на этот номер. Просим добавить этот номер в контакты Вашего телефона.';
                    // подключить сообщение
                    // @ts-ignore
                    promiseAll.push(WhatsappChatApiComProvider.sendTo1dnevnikForActiveToWhatsappInput(phone, phone).toPromise());
                    //     .subscribe(
                    //     (r) => {
                    //         console.log('INPUT-MESSAGE 5  send', JSON.stringify(r) );
                    //
                    //         let msg = 'Уважаемый родитель. Вам будут приходить оценки Ваших детей на этот номер.';
                    //
                    //         let promise = WhatsappChatApiComProvider.sendMessage( msg, phone).toPromise();
                    //         context.succeed({status: r});
                    //     }
                    // );
                    // @ts-ignore
                    promiseAll.push(WhatsappChatApiComProvider.sendMessage( msg, phone).toPromise());
                    // @ts-ignore
                    promiseAll.push(WhatsappChatApiComProvider.sendMessage( msgToAuthor, author).toPromise());




                    // WhatsappChatApiComProvider.sendTo1dnevnikForActiveToWhatsappInput(phone, author).subscribe(
                    //     (r) => {
                    //         console.log('INPUT-MESSAGE 5  send', JSON.stringify(r) );
                    //         context.succeed({status: r});
                    //     }
                    // )
                }
            }

            Promise.all(promiseAll).then(
                () => {
                    context.succeed({status: true});
                },
                () => {
                    context.succeed({status: true});
                }
            )
        }
    } else if (
        msgType == 'createMsg' &&
        (
            params['phone'] &&
            params['msg']
        )
    ) {
        let phones = params['phone'].replace(/[^0-9\,]/g,'').split(','),
            resultPromises = [],
            msg = params['msg'];


        console.log('CREATE-MESSAGE 0 - phones, msg', JSON.stringify(phones), msg);

        for (let phone of phones) {
            if (phone && phone.length === 11) {
                // send message
                console.log('CREATE-MESSAGE 1 - ADD phone', phone );
                let promise = WhatsappChatApiComProvider.sendMessage( msg, phone).toPromise();
                // @ts-ignore
                resultPromises.push(promise);
                // subscribe(
                //     (r) => {
                //         console.log('CREATE-MESSAGE 1 - SEND result', JSON.stringify(r));
                //         context.succeed({status: r});
                //     },
                //     (error) => {
                //         console.log('CREATE-MESSAGE 2 - error', JSON.stringify(error));
                //     },
                //     () => {
                //         console.log('CREATE-MESSAGE 3 - complete' );
                //     }
                // )
            }
        }

        Promise.all(resultPromises).then(
            (r) => {
                console.log('CREATE-MESSAGE 2 - result', JSON.stringify(r) );
                context.succeed({status: true});
            },
            (e) => {
                console.log('CREATE-MESSAGE 3 - e', JSON.stringify(e) );
                context.succeed({status: false});

            }
        );

    } else {
        console.log('CREATE-MESSAGE 4 - callback', {status: false});
        callback(null, {status: false});
    }


    console.log('CREATE-MESSAGE 7 - callback');

};

export {handler};