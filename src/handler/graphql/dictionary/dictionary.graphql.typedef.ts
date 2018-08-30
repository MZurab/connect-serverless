export const DictionaryTypeDef = `
  
    extend type Query {
        getDictionary: Dictionary
    }
    
    type Dictionary {
        status: Boolean!,
        dictionary: [DictionaryType],
        defaultLanguage: String,
        includedLanguages: [String]!,
        possibleLanguages: [String]!,
        hash: String!
    }
        type DictionaryType {
            key: String!
            value: DictionaryValueType!  
        }
            type DictionaryValueType {
                en: String
                ru: String
            }
`;