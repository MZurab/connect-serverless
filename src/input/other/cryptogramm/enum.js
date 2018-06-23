// https://dssclients.taxnet.ru/Documentation/namespace_taxnet_1_1_cryptx_d_s_s_1_1_web_service_1_1_interface_1_1_enum.html#a0198973274c97e9e24791e155c991ef5
const _ = {};

const CompressionType = {
  'NoCompression'             : 0,  //Не использовать сжатие
  'CompressionBefore'         : 1,  //Сжимать исходные данные перед криптооперацией
  'CompressionAfter'          : 2,  //Сжимать результат после криптооперации
  'CompressionBeforeAndAfter' : 3   //Сжимать данные и перед и после криптооперации
}; _.CompressionType = CompressionType;

const SignatureType = {
  'CMS'       : 0,  //Подпись стандарта "Cryptographic Message Syntax"
  'CAdES'     : 1,  //Подпись стандарта "CMS Advanced Electronic Signatures", расширенной версии стандарта CMS
  'XmldSig'   : 2,  //Электронная подпись по ГОСТ Р 34.10 - 2001 - Подпись документа в формате XMLDSig
  'Pdf'       : 3,  //Подпись PDF документов
  'MsOffice'  : 4  //Подпись документов MS Word и Excel
}; _.SignatureType = SignatureType;

const EncodingTypeData = {
  'DefaultEncoding'           : 0,  //Использовать кодировку из настроек или кодировку по умолчанию
  'Base64'                    : 1,  //Данные представлены в Base64
  'Base64WithHeaders'         : 2,  //Данные представлены в Base64 с добавлением информационных Base64 заголовков
  'Binary'                    : 3   //Данные представлены в двоичном формате в кодировке ASCII
}; _.EncodingTypeData = EncodingTypeData;


const TypeSignatureVerification = {
  'SignatureOnly'             : 0,
  'SignatureAndCertificate'   : 1
}; _.TypeSignatureVerification = TypeSignatureVerification;

const VerifyCertificateType = {
  'NoCheck'                                     : 0x1000, //Не проверять
  'Online'                                      : 0x2000, //Проверять отозванность по локальному СОС, если локальный СОС просрочен, загружать СОС по сети
  'Offline'                                     : 0x3000, //Проверять отозванность по локальному СОС
  'EndCertificateOnly'                          : 0x100,  //Проверять на отозванность только пользовательский сертификат
  'ExcludeRoot'                                 : 0x200,  //Проверять на отозванность все сертификаты в цепочки за исключением корневого сертификата
  'EntireChain'                                 : 0x300,  //Проверять на отозванность все сертификаты цепочки
  'IgnoreNotTimeValid'                          : 0x1,    //Игнорировать недействительное время
  'IgnoreNotTimeNested '                        : 0x2,    //Игнорировать не вложенное время
  'AllowUnknownCertificateAuthority'            : 0x4,
  'IgnoreEndRevocationUnknown'                  : 0x8,
  'IgnoreCertificateAuthorityRevocationUnknown' : 0x10,
  'IgnoreRootRevocationUnknown'                 : 0x20
}; _.VerifyCertificateType = VerifyCertificateType;

const VerifyDateTimeType = {
  'CurrentDateTime'           : 1,  //Текущее время
  'DateTimeFromTimestamp'     : 2,  //Время из штампа
  'DateTimeFromSignature'     : 3   //Время из подписи
}; _.VerifyDateTimeType = VerifyDateTimeType;


const AuthConfirmType = {
  'None'        : 0,  //Отсутствует
  'Sms'         : 1,  //СМС
  'Certificate' : 2,  //Сертификат
  'Identify'    : 3   //Identify (внешнее приложение аутентификации)
}; _.AuthConfirmType = AuthConfirmType;

module.exports = _;
