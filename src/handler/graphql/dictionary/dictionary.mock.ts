export namespace Mock {
    export const Dictionary = {
        status: true,
        dictionary: [
            {
                key: 'test',
                value: {
                    'ru': 'test - ru',
                    'en': 'test - en'
                }
        }],
        includedLanguages: ['ru', 'en'],
        possibleLanguages: ['ru', 'en'],
        defaultLanguage: 'ru',
        hash: 'hash1'
    };

    export const Hash = {
        hash: 'hash1',
        status: true
    };
}