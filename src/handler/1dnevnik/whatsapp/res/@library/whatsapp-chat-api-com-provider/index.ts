import {Connect} from "../../../../../../input/connect";

import * as request from 'request';
import {ChatApiComResponseType} from "./res/@type/@response/response.type";
import {Observable, Observer} from "rxjs";

export class WhatsappChatApiComProvider {
    static sendTo1dnevnikForActiveToWhatsappInput (phone: string, chatId: string ): Observable<boolean> {
        return Observable.create(
            (observer: Observer<boolean>) => {
                let urlForAddTelegram = `http://lk.ramman.net/api/device/whatsapp.php?phone=${phone}&whatsapp_id=${chatId}&type=addId`;
                Connect.getUrlHttpsRequest(
                    urlForAddTelegram
                ).subscribe (
                    (r) => {
                        console.log('sendTo1dnevnikForActiveToWhatsappInput -r', JSON.stringify(r));
                        let error = r.error, body: any = {}, msgForAnswer: string = '';

                        if ( !error && r.body ) {
                            body = JSON.parse(r.body);
                        }

                        if( body && body.success === 1 ) {
                            msgForAnswer = 'Вы успешно вошли.\n Под номером - '+phone;

                        } else {
                            msgForAnswer = `Ошибка! Такой ${phone} номер телефона не найден.`;
                        }


                        // send message
                        WhatsappChatApiComProvider.sendMessage( msgForAnswer, chatId).subscribe(
                            () => {
                                observer.next(true)
                            },
                            () => {
                                observer.next(false)

                            },
                            () => {
                                observer.complete();
                            }
                        )
                    }
                );
            }
        )
    }

    static sendMessage (msg: string, id: string): Observable<boolean> {
        let options = {
            method: 'POST',
            url: 'https://eu3.chat-api.com/instance11456/message',
            qs: { token: 'cd9323zlkxc8m8ab' },
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
            body: {
                phone: id, // '79959051993',
                body: msg  // 'Уважаемые родитель. Вам будут приходить сообщения которые будут отправлены на 79288955755'
            },
            json: true
        };

        return Observable.create(
            (observer: Observer<boolean>) => {
                request(
                    options,
                    (error, response, body: ChatApiComResponseType) => {
                        console.log('sendMessage error', error );
                        console.log('sendMessage body', body );
                        if (error) {
                            observer.error(error);
                        } else {
                            observer.next(true);
                        }
                        observer.complete();
                    }
                );
            }
        )
    }
}




