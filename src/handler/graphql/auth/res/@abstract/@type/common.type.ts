export namespace DictionaryType {
    export type GetDictionaryResolverType = {
        status: boolean,
        dictionary:
            {
                key: string,
                value: {
                    [s: string]: string | number
                }
            }[],
        includedLanguages: string[],
        possibleLanguages: string[],
        defaultLanguage: string,
        hash: string
    }
}