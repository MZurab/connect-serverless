import {OperationTypeEnum} from "../@enum/operation-type.enum";

export type OperationType = {
    id?: string,
    key: string,
    blocks: string[],

    type: OperationTypeEnum,
    _setValue?: any,
    _eachByClass?: any,
}


// Реализовать получение обхекта по ключу другого объекта
// gid2.$1(gl_f_textArea):body>value    => id-gid2{1[,1]}.$lid_1(gl_f_textArea{1,1}):body>value
// ${key: string}-{offset: number}\({id: string}\{deepStart:number, deepEnd\}\)

// Как сделать общим для всех объектов без привязки к фриформам
// Сейчас есть localId (lid), есть id (id)

// Также надо добавить класс + class

// В итоге добавим класс к фриформам и оставим как есть назовем freefrom reference
// Также добавми value с типом freeform reference


/*
* Cначала собираем блоки
* Потом отправляем собранные блоки
* Задача научить динамечкое создание блоков
*
* */