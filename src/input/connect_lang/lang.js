// const DINAMO    = require("./../aws/dinamo");
// const FILE      = require("./../aws/s3");
// const Template7 = require("./../template7/template7");
// const APP_PAGE  = require("./app-page.js");
const LOG     = require('ramman-z-log');

const _  = {};
const lang  = {
  'ru' : true, // Russia
  'ab' : true, // Абхазский
  'az' : true, // Азербайджанский
  'ay' : true, // Аймарский
  'sq' : true, // Албанский
  'en' : true, // Английский
  'ar' : true, // Арабский
  'hy' : true, // Армянский
  'as' : true, // Ассамский
  'nl' : true, // Голландский

  'af' : true, // Африкаанс
  'ba' : true, // Башкирский
  'be' : true, // Белорусский
  'bn' : true, // Бенгальский
  'bg' : true, // Болгарский
  'br' : true, // Бретонский
  'cy' : true, // Валлийский
  'hu' : true, // Венгерский
  'vi' : true, // Вьетнамский
  'gl' : true, // Галисийский

  'el' : true, // Греческий
  'ka' : true, // Грузинский
  'gn' : true, // Гуарани
  'da' : true, // Датский
  'zu' : true, // Зулу
  'iw' : true, // Иврит
  'ji' : true, // Идиш
  'in' : true, // Индонезийский
  'ia' : true, // Интерлингва (искусственный язык)
  'ga' : true, // Ирландский

  'is' : true, // Исландский
  'es' : true, // Испанский
  'it' : true, // Итальянский
  'kk' : true, // Казахский
  'km' : true, // Камбоджийский
  'ca' : true, // Каталанский
  'ks' : true, // Кашмирский
  'qu' : true, // Кечуа
  'ky' : true, // Киргизский
  'zh' : true, // Китайский

  'ko' : true, // Корейский
  'co' : true, // Корсиканский
  'ku' : true, // Курдский
  'lo' : true, // Лаосский
  'lv' : true, // Латвийский, латышский
  'la' : true, // Латынь
  'lt' : true, // Литовский
  'mg' : true, // Малагасийский
  'ms' : true, // Малайский
  'mt' : true, // Мальтийский

  'mi' : true, // Маори
  'mk' : true, // Македонский
  'mo' : true, // Молдавский
  'mn' : true, // Монгольский
  'na' : true, // Науру
  'de' : true, // Немецкий
  'ne' : true, // Непальский
  'no' : true, // Норвежский
  'pa' : true, // Пенджаби
  'fa' : true, // Персидский

  'pl' : true, // Польский
  'pt' : true, // Португальский
  'ps' : true, // Пуштунский
  'rm' : true, // Ретороманский
  'ro' : true, // Румынский
  'sm' : true, // Самоанский
  'sa' : true, // Санскрит
  'sr' : true, // Сербский
  'sk' : true, // Словацкий
  'sl' : true, // Словенский

  'so' : true, // Сомали
  'sw' : true, // Суахили
  'su' : true, // Суданский
  'tl' : true, // Тагальский
  'tg' : true, // Таджикский
  'th' : true, // Тайский
  'ta' : true, // Тамильский
  'tt' : true, // Татарский
  'bo' : true, // Тибетский
  'to' : true, // Тонга

  'tr' : true, // Турецкий
  'tk' : true, // Туркменский
  'uz' : true, // Узбекский
  'uk' : true, // Украинский
  'fj' : true, // Фиджи
  'ur' : true, // Урду
  'fi' : true, // Финский
  'fr' : true, // Французский
  'fy' : true, // Фризский
  'ha' : true, // Хауса

  'hi' : true, // Хинди
  'hr' : true, // Хорватский
  'cs' : true, // Чешский
  'sv' : true, // Шведский
  'eo' : true, // Эсперанто (искусственный язык)
  'et' : true, // Эстонский
  'jw' : true, // Яванский
  'ja' : true, // Японский
};



//
//@< FUNCTION
  function check ( iNname ) {
    /*
        @example
          getLang('ru') true
          getLang('df') false
        @discr
          get language
        @inputs
          @required
            iNname  -> string
      */
    if(typeof iNname == 'string')
      if ( lang[iNname] ) return lang[iNname];
    return false;
  }
  _['check'] = check;

  function getLangByArray ( iNdata ) {
    /*
        @example
          getLangByArray( { 'user':{'ru':1} } ) -> true
          getLangByArray( { 'ru': } ) -> true
        @discr
          get language
        @inputs
          @required
            iNname  -> string
      */
    LOG.printObject('getLangByArray iNdata',iNdata);
    if(typeof iNdata == 'object') {
      for ( iKey in iNdata ) {
        var newObj = iNdata[iKey];
        LOG.printObject('getLangByArray newObj',newObj);
        if ( typeof newObj == 'string' && check(newObj) ) {
          LOG.printObject('getLangByArray return newObj',newObj);
          return newObj;
        } else if (typeof newObj == 'object'){
          LOG.printObject('getLangByArray return etLangByArray(newObj)',getLangByArray(newObj));
          return getLangByArray(newObj);
        }
      }
    }
    return '*';
  }
  _['getLangByArray'] = getLangByArray;


  function safeGetLang (iNobject,iNlang) {
    /*
        @example
          getLasafeGetLangng({'ru':'ruSomeText','en':'someText2'},'ru') -> "ruSomeText"
          getLasafeGetLangng({'en':'someText2'},'ru') -> false
          getLasafeGetLangng({'*':'someText2'},'ru') -> "someText2"
        @discr
          get from object by languge key or by '*'
        @inputs
          @required
            iNobject  -> object
            iNlang -> string
        @return
          :string OR :bool false

      */
      if(typeof iNobject != 'object')return false;
      if(typeof iNobject[iNlang] != 'undefined'){
        return  iNobject[iNlang];
      } else if (typeof iNobject['*'] != 'undefined') {
        return iNobject['*'];
      }
      return false;

  }
  _['safeGetLang'] = safeGetLang;
//@> FUNCTION

module.exports = _;
