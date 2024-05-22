# 🏁 next-flag

## 📡 Install

```console
npm install next-flag

yarn add next-flag

pnpm add next-flag
```

## 🚀 Getting started

## 📚 TSDoc

<!-- TSDOC_START -->

## :toolbox: Functions

- [getFeatures](#gear-getfeatures)
- [isFeatureEnabled](#gear-isfeatureenabled)
- [useNextFlag](#gear-usenextflag)
- [NextFlagProvider](#gear-nextflagprovider)

### :gear: getFeatures

| Function      | Type                                                |
| ------------- | --------------------------------------------------- |
| `getFeatures` | `(props?: GetFeaturesArgs) => Promise<GetFeatures>` |

### :gear: isFeatureEnabled

| Function           | Type                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| `isFeatureEnabled` | `(feature: string or string[], options?: IsFeatureEnabledOptions) => Promise<boolean>` |

### :gear: useNextFlag

| Function      | Type                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useNextFlag` | `(props?: UseNextFlagHookProps) => { loading: boolean; features: GetFeatures; error: Error or undefined; isFeatureEnabled: (feature: string or string[]) => boolean; }` |

### :gear: NextFlagProvider

| Function           | Type                                                |
| ------------------ | --------------------------------------------------- |
| `NextFlagProvider` | `(props: NextFlagProviderProps) => Element or null` |

## :wrench: Constants

- [NextFlagContext](#gear-nextflagcontext)

### :gear: NextFlagContext

| Constant          | Type                                |
| ----------------- | ----------------------------------- |
| `NextFlagContext` | `Context<GetFeatures or undefined>` |

## :factory: NextFlag

### Methods

- [GET](#gear-get)
- [isFeatureEnabled](#gear-isfeatureenabled)
- [getFeatures](#gear-getfeatures)
- [POST](#gear-post)

#### :gear: GET

| Method | Type                                                       |
| ------ | ---------------------------------------------------------- |
| `GET`  | `(req: NextRequest) => Promise<NextResponse<GetFeatures>>` |

#### :gear: isFeatureEnabled

| Method             | Type                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| `isFeatureEnabled` | `(feature: string or string[], project?: string or undefined) => Promise<boolean>` |

#### :gear: getFeatures

| Method        | Type                                                      |
| ------------- | --------------------------------------------------------- |
| `getFeatures` | `(project?: string or undefined) => Promise<GetFeatures>` |

#### :gear: POST

| Method | Type                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------- |
| `POST` | `(req: NextRequest) => Promise<NextResponse<{ error: string; }> or NextResponse<{ success: boolean; }>>` |

<!-- TSDOC_END -->
