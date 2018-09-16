import {Observable, Observer} from "rxjs";
import {MzDynamoDb} from "../../../../input/aws/dynamo/dynamo";
import {DictionaryType} from "./res/@abstract/@type/common.type";
import * as crypto from 'crypto';

export namespace Dictionary {
    import GetDictionaryResolverType = DictionaryType.GetDictionaryResolverType;
    const tableNameDictionary  = "connect-dictionary";

    export function get (uid): Observable<GetDictionaryResolverType> {
        return Observable.create(
            (observer: Observer<any>) => {
                getDictionary(uid).subscribe(
                    (dictionary) => {
                        let status = !!dictionary,
                            result = {
                                status: status,
                                dictionary: dictionary,
                                includedLanguages: ['ru', 'en'],
                                possibleLanguages: ['ru', 'en'],
                                defaultLanguage: 'ru',
                                hash: crypto.createHash('md5').update(JSON.stringify(dictionary)).digest("hex")
                            };

                        observer.next(result);
                        observer.complete();
                    }
                )

            }
        );
    }

         function getDictionary (uid: string): Observable<any> {
            return Observable.create(
                (observer: Observer<any>) => {
                    let objForQuery = {'table':tableNameDictionary,'index':'uid-status-index'};

                    objForQuery = MzDynamoDb.addByMask({'status':0},'status',objForQuery,'number');
                    objForQuery = MzDynamoDb.addByMask({'uid':uid},'uid',objForQuery);

                    MzDynamoDb.query(objForQuery).subscribe(
                        (d) => {
                            let err = d.err,data = d.data;
                            if(!err && data.Count > 0){
                                // let result = collectForResponce(data.Items,lang);
                                observer.next(collectForResponce(data.Items));
                                return;
                            } else {
                                observer.next(null);
                            }
                            observer.complete();
                        }
                    );
                }
            );
        }
            function collectForResponce (items: {key: string, values: any}[]): {key: string, value: any}[] {
                return items.reduce(
                    (acumulator: any[], item) => {
                        let prefix = item.key;
                        for(let key of Object.keys(item.values)) {
                            acumulator.push(
                                {
                                    key: `${prefix}.${key}`,
                                    value: item.values[key]
                                }
                            )
                        }


                        return acumulator;
                    },
                    []
                )
            }
}