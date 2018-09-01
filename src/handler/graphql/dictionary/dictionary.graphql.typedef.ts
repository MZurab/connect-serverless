export const DictionaryTypeDef = `
  
    extend type Query {
        # some description
        getDictionary: Dictionary
    }
    
    # the schema allows the following query - Dictionary
    type Dictionary {
        # The status answer
        status: Boolean!,
        # The dictionary for client -
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