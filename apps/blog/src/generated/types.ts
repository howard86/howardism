/* eslint-disable */
export type Maybe<T> = T
export type InputMaybe<T> = T
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  AboutBlocksDynamicZoneInput: any
  ArticleBlocksDynamicZoneInput: any
  Date: string
  DateTime: any
  JSON: any
  Upload: any
}

export type About = {
  __typename?: "About"
  blocks?: Maybe<Array<Maybe<AboutBlocksDynamicZone>>>
  createdAt?: Maybe<Scalars["DateTime"]>
  title?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type AboutBlocksDynamicZone =
  | ComponentSharedQuote
  | ComponentSharedRichText
  | ComponentSharedSlider
  | Error

export type AboutEntity = {
  __typename?: "AboutEntity"
  attributes?: Maybe<About>
  id?: Maybe<Scalars["ID"]>
}

export type AboutEntityResponse = {
  __typename?: "AboutEntityResponse"
  data?: Maybe<AboutEntity>
}

export type AboutInput = {
  blocks?: InputMaybe<Array<Scalars["AboutBlocksDynamicZoneInput"]>>
  title?: InputMaybe<Scalars["String"]>
}

export type AboutSection = {
  __typename?: "AboutSection"
  createdAt?: Maybe<Scalars["DateTime"]>
  interest_items?: Maybe<InterestItemRelationResponseCollection>
  interest_title?: Maybe<Scalars["String"]>
  introduction?: Maybe<Scalars["String"]>
  profile?: Maybe<UploadFileEntityResponse>
  publishedAt?: Maybe<Scalars["DateTime"]>
  section?: Maybe<ComponentComponentSection>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type AboutSectionInterest_ItemsArgs = {
  filters?: InputMaybe<InterestItemFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type AboutSectionEntity = {
  __typename?: "AboutSectionEntity"
  attributes?: Maybe<AboutSection>
  id?: Maybe<Scalars["ID"]>
}

export type AboutSectionEntityResponse = {
  __typename?: "AboutSectionEntityResponse"
  data?: Maybe<AboutSectionEntity>
}

export type AboutSectionInput = {
  interest_items?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  interest_title?: InputMaybe<Scalars["String"]>
  introduction?: InputMaybe<Scalars["String"]>
  profile?: InputMaybe<Scalars["ID"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  section?: InputMaybe<ComponentComponentSectionInput>
}

export type Article = {
  __typename?: "Article"
  author?: Maybe<AuthorEntityResponse>
  blocks?: Maybe<Array<Maybe<ArticleBlocksDynamicZone>>>
  category?: Maybe<CategoryEntityResponse>
  cover?: Maybe<UploadFileEntityResponse>
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  slug?: Maybe<Scalars["String"]>
  title?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type ArticleBlocksDynamicZone =
  | ComponentSharedQuote
  | ComponentSharedRichText
  | ComponentSharedSlider
  | Error

export type ArticleEntity = {
  __typename?: "ArticleEntity"
  attributes?: Maybe<Article>
  id?: Maybe<Scalars["ID"]>
}

export type ArticleEntityResponse = {
  __typename?: "ArticleEntityResponse"
  data?: Maybe<ArticleEntity>
}

export type ArticleEntityResponseCollection = {
  __typename?: "ArticleEntityResponseCollection"
  data: Array<ArticleEntity>
  meta: ResponseCollectionMeta
}

export type ArticleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ArticleFiltersInput>>>
  author?: InputMaybe<AuthorFiltersInput>
  category?: InputMaybe<CategoryFiltersInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  not?: InputMaybe<ArticleFiltersInput>
  or?: InputMaybe<Array<InputMaybe<ArticleFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  slug?: InputMaybe<StringFilterInput>
  title?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type ArticleInput = {
  author?: InputMaybe<Scalars["ID"]>
  blocks?: InputMaybe<Array<Scalars["ArticleBlocksDynamicZoneInput"]>>
  category?: InputMaybe<Scalars["ID"]>
  cover?: InputMaybe<Scalars["ID"]>
  description?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  slug?: InputMaybe<Scalars["String"]>
  title?: InputMaybe<Scalars["String"]>
}

export type ArticleRelationResponseCollection = {
  __typename?: "ArticleRelationResponseCollection"
  data: Array<ArticleEntity>
}

export type Author = {
  __typename?: "Author"
  articles?: Maybe<ArticleRelationResponseCollection>
  avatar?: Maybe<UploadFileEntityResponse>
  createdAt?: Maybe<Scalars["DateTime"]>
  email?: Maybe<Scalars["String"]>
  name?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type AuthorArticlesArgs = {
  filters?: InputMaybe<ArticleFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type AuthorEntity = {
  __typename?: "AuthorEntity"
  attributes?: Maybe<Author>
  id?: Maybe<Scalars["ID"]>
}

export type AuthorEntityResponse = {
  __typename?: "AuthorEntityResponse"
  data?: Maybe<AuthorEntity>
}

export type AuthorEntityResponseCollection = {
  __typename?: "AuthorEntityResponseCollection"
  data: Array<AuthorEntity>
  meta: ResponseCollectionMeta
}

export type AuthorFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<AuthorFiltersInput>>>
  articles?: InputMaybe<ArticleFiltersInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  email?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<AuthorFiltersInput>
  or?: InputMaybe<Array<InputMaybe<AuthorFiltersInput>>>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type AuthorInput = {
  articles?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  avatar?: InputMaybe<Scalars["ID"]>
  email?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
}

export type Book = {
  __typename?: "Book"
  author?: Maybe<Scalars["String"]>
  createdAt?: Maybe<Scalars["DateTime"]>
  name?: Maybe<Scalars["String"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  summary?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
  url?: Maybe<ComponentSharedUrl>
}

export type BookEntity = {
  __typename?: "BookEntity"
  attributes?: Maybe<Book>
  id?: Maybe<Scalars["ID"]>
}

export type BookEntityResponse = {
  __typename?: "BookEntityResponse"
  data?: Maybe<BookEntity>
}

export type BookEntityResponseCollection = {
  __typename?: "BookEntityResponseCollection"
  data: Array<BookEntity>
  meta: ResponseCollectionMeta
}

export type BookFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<BookFiltersInput>>>
  author?: InputMaybe<StringFilterInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<BookFiltersInput>
  or?: InputMaybe<Array<InputMaybe<BookFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  summary?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
  url?: InputMaybe<ComponentSharedUrlFiltersInput>
}

export type BookInput = {
  author?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  summary?: InputMaybe<Scalars["String"]>
  url?: InputMaybe<ComponentSharedUrlInput>
}

export type BookRelationResponseCollection = {
  __typename?: "BookRelationResponseCollection"
  data: Array<BookEntity>
}

export type BooleanFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["Boolean"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["Boolean"]>>>
  contains?: InputMaybe<Scalars["Boolean"]>
  containsi?: InputMaybe<Scalars["Boolean"]>
  endsWith?: InputMaybe<Scalars["Boolean"]>
  eq?: InputMaybe<Scalars["Boolean"]>
  eqi?: InputMaybe<Scalars["Boolean"]>
  gt?: InputMaybe<Scalars["Boolean"]>
  gte?: InputMaybe<Scalars["Boolean"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["Boolean"]>>>
  lt?: InputMaybe<Scalars["Boolean"]>
  lte?: InputMaybe<Scalars["Boolean"]>
  ne?: InputMaybe<Scalars["Boolean"]>
  not?: InputMaybe<BooleanFilterInput>
  notContains?: InputMaybe<Scalars["Boolean"]>
  notContainsi?: InputMaybe<Scalars["Boolean"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["Boolean"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["Boolean"]>>>
  startsWith?: InputMaybe<Scalars["Boolean"]>
}

export type Category = {
  __typename?: "Category"
  articles?: Maybe<ArticleRelationResponseCollection>
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  name?: Maybe<Scalars["String"]>
  slug?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type CategoryArticlesArgs = {
  filters?: InputMaybe<ArticleFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type CategoryEntity = {
  __typename?: "CategoryEntity"
  attributes?: Maybe<Category>
  id?: Maybe<Scalars["ID"]>
}

export type CategoryEntityResponse = {
  __typename?: "CategoryEntityResponse"
  data?: Maybe<CategoryEntity>
}

export type CategoryEntityResponseCollection = {
  __typename?: "CategoryEntityResponseCollection"
  data: Array<CategoryEntity>
  meta: ResponseCollectionMeta
}

export type CategoryFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<CategoryFiltersInput>>>
  articles?: InputMaybe<ArticleFiltersInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<CategoryFiltersInput>
  or?: InputMaybe<Array<InputMaybe<CategoryFiltersInput>>>
  slug?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type CategoryInput = {
  articles?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  description?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
  slug?: InputMaybe<Scalars["String"]>
}

export type ComponentComponentSection = {
  __typename?: "ComponentComponentSection"
  description?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  title?: Maybe<Scalars["String"]>
}

export type ComponentComponentSectionInput = {
  description?: InputMaybe<Scalars["String"]>
  id?: InputMaybe<Scalars["ID"]>
  title?: InputMaybe<Scalars["String"]>
}

export type ComponentResourceBook = {
  __typename?: "ComponentResourceBook"
  author?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  name?: Maybe<Scalars["String"]>
  summary?: Maybe<Scalars["String"]>
  url?: Maybe<ComponentSharedUrl>
}

export type ComponentResourcePodcast = {
  __typename?: "ComponentResourcePodcast"
  id: Scalars["ID"]
  name?: Maybe<Scalars["String"]>
  summary?: Maybe<Scalars["String"]>
  url?: Maybe<ComponentSharedUrl>
}

export type ComponentSharedMetaSocial = {
  __typename?: "ComponentSharedMetaSocial"
  description: Scalars["String"]
  id: Scalars["ID"]
  image?: Maybe<UploadFileEntityResponse>
  socialNetwork: Enum_Componentsharedmetasocial_Socialnetwork
  title: Scalars["String"]
}

export type ComponentSharedMetaSocialFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentSharedMetaSocialFiltersInput>>>
  description?: InputMaybe<StringFilterInput>
  not?: InputMaybe<ComponentSharedMetaSocialFiltersInput>
  or?: InputMaybe<Array<InputMaybe<ComponentSharedMetaSocialFiltersInput>>>
  socialNetwork?: InputMaybe<StringFilterInput>
  title?: InputMaybe<StringFilterInput>
}

export type ComponentSharedQuote = {
  __typename?: "ComponentSharedQuote"
  body?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  title?: Maybe<Scalars["String"]>
}

export type ComponentSharedRichText = {
  __typename?: "ComponentSharedRichText"
  body?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
}

export type ComponentSharedSeo = {
  __typename?: "ComponentSharedSeo"
  canonicalURL?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  keywords?: Maybe<Scalars["String"]>
  metaDescription: Scalars["String"]
  metaImage: UploadFileEntityResponse
  metaRobots?: Maybe<Scalars["String"]>
  metaSocial?: Maybe<Array<Maybe<ComponentSharedMetaSocial>>>
  metaTitle: Scalars["String"]
  metaViewport?: Maybe<Scalars["String"]>
  structuredData?: Maybe<Scalars["JSON"]>
}

export type ComponentSharedSeoMetaSocialArgs = {
  filters?: InputMaybe<ComponentSharedMetaSocialFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ComponentSharedSlider = {
  __typename?: "ComponentSharedSlider"
  files?: Maybe<UploadFileRelationResponseCollection>
  id: Scalars["ID"]
}

export type ComponentSharedSliderFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ComponentSharedUrl = {
  __typename?: "ComponentSharedUrl"
  id: Scalars["ID"]
  link: Scalars["String"]
}

export type ComponentSharedUrlFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<ComponentSharedUrlFiltersInput>>>
  link?: InputMaybe<StringFilterInput>
  not?: InputMaybe<ComponentSharedUrlFiltersInput>
  or?: InputMaybe<Array<InputMaybe<ComponentSharedUrlFiltersInput>>>
}

export type ComponentSharedUrlInput = {
  id?: InputMaybe<Scalars["ID"]>
  link?: InputMaybe<Scalars["String"]>
}

export type DateFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["Date"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["Date"]>>>
  contains?: InputMaybe<Scalars["Date"]>
  containsi?: InputMaybe<Scalars["Date"]>
  endsWith?: InputMaybe<Scalars["Date"]>
  eq?: InputMaybe<Scalars["Date"]>
  eqi?: InputMaybe<Scalars["Date"]>
  gt?: InputMaybe<Scalars["Date"]>
  gte?: InputMaybe<Scalars["Date"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["Date"]>>>
  lt?: InputMaybe<Scalars["Date"]>
  lte?: InputMaybe<Scalars["Date"]>
  ne?: InputMaybe<Scalars["Date"]>
  not?: InputMaybe<DateFilterInput>
  notContains?: InputMaybe<Scalars["Date"]>
  notContainsi?: InputMaybe<Scalars["Date"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["Date"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["Date"]>>>
  startsWith?: InputMaybe<Scalars["Date"]>
}

export type DateTimeFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]>>>
  contains?: InputMaybe<Scalars["DateTime"]>
  containsi?: InputMaybe<Scalars["DateTime"]>
  endsWith?: InputMaybe<Scalars["DateTime"]>
  eq?: InputMaybe<Scalars["DateTime"]>
  eqi?: InputMaybe<Scalars["DateTime"]>
  gt?: InputMaybe<Scalars["DateTime"]>
  gte?: InputMaybe<Scalars["DateTime"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]>>>
  lt?: InputMaybe<Scalars["DateTime"]>
  lte?: InputMaybe<Scalars["DateTime"]>
  ne?: InputMaybe<Scalars["DateTime"]>
  not?: InputMaybe<DateTimeFilterInput>
  notContains?: InputMaybe<Scalars["DateTime"]>
  notContainsi?: InputMaybe<Scalars["DateTime"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["DateTime"]>>>
  startsWith?: InputMaybe<Scalars["DateTime"]>
}

export enum Enum_Componentsharedmetasocial_Socialnetwork {
  Facebook = "Facebook",
  Twitter = "Twitter",
}

export type Error = {
  __typename?: "Error"
  code: Scalars["String"]
  message?: Maybe<Scalars["String"]>
}

export type ExperienceSection = {
  __typename?: "ExperienceSection"
  createdAt?: Maybe<Scalars["DateTime"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  section?: Maybe<ComponentComponentSection>
  side_projects?: Maybe<SideProjectRelationResponseCollection>
  tech_tools?: Maybe<TechToolRelationResponseCollection>
  updatedAt?: Maybe<Scalars["DateTime"]>
  work_experiences?: Maybe<WorkExperienceRelationResponseCollection>
}

export type ExperienceSectionSide_ProjectsArgs = {
  filters?: InputMaybe<SideProjectFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ExperienceSectionTech_ToolsArgs = {
  filters?: InputMaybe<TechToolFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ExperienceSectionWork_ExperiencesArgs = {
  filters?: InputMaybe<WorkExperienceFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ExperienceSectionEntity = {
  __typename?: "ExperienceSectionEntity"
  attributes?: Maybe<ExperienceSection>
  id?: Maybe<Scalars["ID"]>
}

export type ExperienceSectionEntityResponse = {
  __typename?: "ExperienceSectionEntityResponse"
  data?: Maybe<ExperienceSectionEntity>
}

export type ExperienceSectionInput = {
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  section?: InputMaybe<ComponentComponentSectionInput>
  side_projects?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  tech_tools?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  work_experiences?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
}

export type FileInfoInput = {
  alternativeText?: InputMaybe<Scalars["String"]>
  caption?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
}

export type FloatFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["Float"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["Float"]>>>
  contains?: InputMaybe<Scalars["Float"]>
  containsi?: InputMaybe<Scalars["Float"]>
  endsWith?: InputMaybe<Scalars["Float"]>
  eq?: InputMaybe<Scalars["Float"]>
  eqi?: InputMaybe<Scalars["Float"]>
  gt?: InputMaybe<Scalars["Float"]>
  gte?: InputMaybe<Scalars["Float"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["Float"]>>>
  lt?: InputMaybe<Scalars["Float"]>
  lte?: InputMaybe<Scalars["Float"]>
  ne?: InputMaybe<Scalars["Float"]>
  not?: InputMaybe<FloatFilterInput>
  notContains?: InputMaybe<Scalars["Float"]>
  notContainsi?: InputMaybe<Scalars["Float"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["Float"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["Float"]>>>
  startsWith?: InputMaybe<Scalars["Float"]>
}

export type GenericMorph =
  | About
  | AboutSection
  | Article
  | Author
  | Book
  | Category
  | ComponentComponentSection
  | ComponentResourceBook
  | ComponentResourcePodcast
  | ComponentSharedMetaSocial
  | ComponentSharedQuote
  | ComponentSharedRichText
  | ComponentSharedSeo
  | ComponentSharedSlider
  | ComponentSharedUrl
  | ExperienceSection
  | Global
  | I18NLocale
  | InterestItem
  | ResourceSection
  | SideProject
  | TechTool
  | UploadFile
  | UploadFolder
  | UsersPermissionsPermission
  | UsersPermissionsRole
  | UsersPermissionsUser
  | Website
  | WorkExperience

export type Global = {
  __typename?: "Global"
  createdAt?: Maybe<Scalars["DateTime"]>
  favicon?: Maybe<UploadFileEntityResponse>
  siteDescription: Scalars["String"]
  siteName: Scalars["String"]
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type GlobalEntity = {
  __typename?: "GlobalEntity"
  attributes?: Maybe<Global>
  id?: Maybe<Scalars["ID"]>
}

export type GlobalEntityResponse = {
  __typename?: "GlobalEntityResponse"
  data?: Maybe<GlobalEntity>
}

export type GlobalInput = {
  favicon?: InputMaybe<Scalars["ID"]>
  siteDescription?: InputMaybe<Scalars["String"]>
  siteName?: InputMaybe<Scalars["String"]>
}

export type I18NLocale = {
  __typename?: "I18NLocale"
  code?: Maybe<Scalars["String"]>
  createdAt?: Maybe<Scalars["DateTime"]>
  name?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type I18NLocaleEntity = {
  __typename?: "I18NLocaleEntity"
  attributes?: Maybe<I18NLocale>
  id?: Maybe<Scalars["ID"]>
}

export type I18NLocaleEntityResponse = {
  __typename?: "I18NLocaleEntityResponse"
  data?: Maybe<I18NLocaleEntity>
}

export type I18NLocaleEntityResponseCollection = {
  __typename?: "I18NLocaleEntityResponseCollection"
  data: Array<I18NLocaleEntity>
  meta: ResponseCollectionMeta
}

export type I18NLocaleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>
  code?: InputMaybe<StringFilterInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<I18NLocaleFiltersInput>
  or?: InputMaybe<Array<InputMaybe<I18NLocaleFiltersInput>>>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type IdFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  contains?: InputMaybe<Scalars["ID"]>
  containsi?: InputMaybe<Scalars["ID"]>
  endsWith?: InputMaybe<Scalars["ID"]>
  eq?: InputMaybe<Scalars["ID"]>
  eqi?: InputMaybe<Scalars["ID"]>
  gt?: InputMaybe<Scalars["ID"]>
  gte?: InputMaybe<Scalars["ID"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  lt?: InputMaybe<Scalars["ID"]>
  lte?: InputMaybe<Scalars["ID"]>
  ne?: InputMaybe<Scalars["ID"]>
  not?: InputMaybe<IdFilterInput>
  notContains?: InputMaybe<Scalars["ID"]>
  notContainsi?: InputMaybe<Scalars["ID"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  startsWith?: InputMaybe<Scalars["ID"]>
}

export type IntFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>
  contains?: InputMaybe<Scalars["Int"]>
  containsi?: InputMaybe<Scalars["Int"]>
  endsWith?: InputMaybe<Scalars["Int"]>
  eq?: InputMaybe<Scalars["Int"]>
  eqi?: InputMaybe<Scalars["Int"]>
  gt?: InputMaybe<Scalars["Int"]>
  gte?: InputMaybe<Scalars["Int"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>
  lt?: InputMaybe<Scalars["Int"]>
  lte?: InputMaybe<Scalars["Int"]>
  ne?: InputMaybe<Scalars["Int"]>
  not?: InputMaybe<IntFilterInput>
  notContains?: InputMaybe<Scalars["Int"]>
  notContainsi?: InputMaybe<Scalars["Int"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["Int"]>>>
  startsWith?: InputMaybe<Scalars["Int"]>
}

export type InterestItem = {
  __typename?: "InterestItem"
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  title?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type InterestItemEntity = {
  __typename?: "InterestItemEntity"
  attributes?: Maybe<InterestItem>
  id?: Maybe<Scalars["ID"]>
}

export type InterestItemEntityResponse = {
  __typename?: "InterestItemEntityResponse"
  data?: Maybe<InterestItemEntity>
}

export type InterestItemEntityResponseCollection = {
  __typename?: "InterestItemEntityResponseCollection"
  data: Array<InterestItemEntity>
  meta: ResponseCollectionMeta
}

export type InterestItemFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<InterestItemFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  not?: InputMaybe<InterestItemFiltersInput>
  or?: InputMaybe<Array<InputMaybe<InterestItemFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  title?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type InterestItemInput = {
  description?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  title?: InputMaybe<Scalars["String"]>
}

export type InterestItemRelationResponseCollection = {
  __typename?: "InterestItemRelationResponseCollection"
  data: Array<InterestItemEntity>
}

export type JsonFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["JSON"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["JSON"]>>>
  contains?: InputMaybe<Scalars["JSON"]>
  containsi?: InputMaybe<Scalars["JSON"]>
  endsWith?: InputMaybe<Scalars["JSON"]>
  eq?: InputMaybe<Scalars["JSON"]>
  eqi?: InputMaybe<Scalars["JSON"]>
  gt?: InputMaybe<Scalars["JSON"]>
  gte?: InputMaybe<Scalars["JSON"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["JSON"]>>>
  lt?: InputMaybe<Scalars["JSON"]>
  lte?: InputMaybe<Scalars["JSON"]>
  ne?: InputMaybe<Scalars["JSON"]>
  not?: InputMaybe<JsonFilterInput>
  notContains?: InputMaybe<Scalars["JSON"]>
  notContainsi?: InputMaybe<Scalars["JSON"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["JSON"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["JSON"]>>>
  startsWith?: InputMaybe<Scalars["JSON"]>
}

export type Mutation = {
  __typename?: "Mutation"
  /** Change user password. Confirm with the current password. */
  changePassword?: Maybe<UsersPermissionsLoginPayload>
  createArticle?: Maybe<ArticleEntityResponse>
  createAuthor?: Maybe<AuthorEntityResponse>
  createBook?: Maybe<BookEntityResponse>
  createCategory?: Maybe<CategoryEntityResponse>
  createInterestItem?: Maybe<InterestItemEntityResponse>
  createSideProject?: Maybe<SideProjectEntityResponse>
  createTechTool?: Maybe<TechToolEntityResponse>
  createUploadFile?: Maybe<UploadFileEntityResponse>
  createUploadFolder?: Maybe<UploadFolderEntityResponse>
  /** Create a new role */
  createUsersPermissionsRole?: Maybe<UsersPermissionsCreateRolePayload>
  /** Create a new user */
  createUsersPermissionsUser: UsersPermissionsUserEntityResponse
  createWebsite?: Maybe<WebsiteEntityResponse>
  createWorkExperience?: Maybe<WorkExperienceEntityResponse>
  deleteAbout?: Maybe<AboutEntityResponse>
  deleteAboutSection?: Maybe<AboutSectionEntityResponse>
  deleteArticle?: Maybe<ArticleEntityResponse>
  deleteAuthor?: Maybe<AuthorEntityResponse>
  deleteBook?: Maybe<BookEntityResponse>
  deleteCategory?: Maybe<CategoryEntityResponse>
  deleteExperienceSection?: Maybe<ExperienceSectionEntityResponse>
  deleteGlobal?: Maybe<GlobalEntityResponse>
  deleteInterestItem?: Maybe<InterestItemEntityResponse>
  deleteResourceSection?: Maybe<ResourceSectionEntityResponse>
  deleteSideProject?: Maybe<SideProjectEntityResponse>
  deleteTechTool?: Maybe<TechToolEntityResponse>
  deleteUploadFile?: Maybe<UploadFileEntityResponse>
  deleteUploadFolder?: Maybe<UploadFolderEntityResponse>
  /** Delete an existing role */
  deleteUsersPermissionsRole?: Maybe<UsersPermissionsDeleteRolePayload>
  /** Delete an existing user */
  deleteUsersPermissionsUser: UsersPermissionsUserEntityResponse
  deleteWebsite?: Maybe<WebsiteEntityResponse>
  deleteWorkExperience?: Maybe<WorkExperienceEntityResponse>
  /** Confirm an email users email address */
  emailConfirmation?: Maybe<UsersPermissionsLoginPayload>
  /** Request a reset password token */
  forgotPassword?: Maybe<UsersPermissionsPasswordPayload>
  login: UsersPermissionsLoginPayload
  multipleUpload: Array<Maybe<UploadFileEntityResponse>>
  /** Register a user */
  register: UsersPermissionsLoginPayload
  removeFile?: Maybe<UploadFileEntityResponse>
  /** Reset user password. Confirm with a code (resetToken from forgotPassword) */
  resetPassword?: Maybe<UsersPermissionsLoginPayload>
  updateAbout?: Maybe<AboutEntityResponse>
  updateAboutSection?: Maybe<AboutSectionEntityResponse>
  updateArticle?: Maybe<ArticleEntityResponse>
  updateAuthor?: Maybe<AuthorEntityResponse>
  updateBook?: Maybe<BookEntityResponse>
  updateCategory?: Maybe<CategoryEntityResponse>
  updateExperienceSection?: Maybe<ExperienceSectionEntityResponse>
  updateFileInfo: UploadFileEntityResponse
  updateGlobal?: Maybe<GlobalEntityResponse>
  updateInterestItem?: Maybe<InterestItemEntityResponse>
  updateResourceSection?: Maybe<ResourceSectionEntityResponse>
  updateSideProject?: Maybe<SideProjectEntityResponse>
  updateTechTool?: Maybe<TechToolEntityResponse>
  updateUploadFile?: Maybe<UploadFileEntityResponse>
  updateUploadFolder?: Maybe<UploadFolderEntityResponse>
  /** Update an existing role */
  updateUsersPermissionsRole?: Maybe<UsersPermissionsUpdateRolePayload>
  /** Update an existing user */
  updateUsersPermissionsUser: UsersPermissionsUserEntityResponse
  updateWebsite?: Maybe<WebsiteEntityResponse>
  updateWorkExperience?: Maybe<WorkExperienceEntityResponse>
  upload: UploadFileEntityResponse
}

export type MutationChangePasswordArgs = {
  currentPassword: Scalars["String"]
  password: Scalars["String"]
  passwordConfirmation: Scalars["String"]
}

export type MutationCreateArticleArgs = {
  data: ArticleInput
}

export type MutationCreateAuthorArgs = {
  data: AuthorInput
}

export type MutationCreateBookArgs = {
  data: BookInput
}

export type MutationCreateCategoryArgs = {
  data: CategoryInput
}

export type MutationCreateInterestItemArgs = {
  data: InterestItemInput
}

export type MutationCreateSideProjectArgs = {
  data: SideProjectInput
}

export type MutationCreateTechToolArgs = {
  data: TechToolInput
}

export type MutationCreateUploadFileArgs = {
  data: UploadFileInput
}

export type MutationCreateUploadFolderArgs = {
  data: UploadFolderInput
}

export type MutationCreateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput
}

export type MutationCreateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput
}

export type MutationCreateWebsiteArgs = {
  data: WebsiteInput
}

export type MutationCreateWorkExperienceArgs = {
  data: WorkExperienceInput
}

export type MutationDeleteArticleArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteAuthorArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteBookArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteCategoryArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteInterestItemArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteSideProjectArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteTechToolArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteUploadFileArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteUploadFolderArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteUsersPermissionsRoleArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteUsersPermissionsUserArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteWebsiteArgs = {
  id: Scalars["ID"]
}

export type MutationDeleteWorkExperienceArgs = {
  id: Scalars["ID"]
}

export type MutationEmailConfirmationArgs = {
  confirmation: Scalars["String"]
}

export type MutationForgotPasswordArgs = {
  email: Scalars["String"]
}

export type MutationLoginArgs = {
  input: UsersPermissionsLoginInput
}

export type MutationMultipleUploadArgs = {
  field?: InputMaybe<Scalars["String"]>
  files: Array<InputMaybe<Scalars["Upload"]>>
  ref?: InputMaybe<Scalars["String"]>
  refId?: InputMaybe<Scalars["ID"]>
}

export type MutationRegisterArgs = {
  input: UsersPermissionsRegisterInput
}

export type MutationRemoveFileArgs = {
  id: Scalars["ID"]
}

export type MutationResetPasswordArgs = {
  code: Scalars["String"]
  password: Scalars["String"]
  passwordConfirmation: Scalars["String"]
}

export type MutationUpdateAboutArgs = {
  data: AboutInput
}

export type MutationUpdateAboutSectionArgs = {
  data: AboutSectionInput
}

export type MutationUpdateArticleArgs = {
  data: ArticleInput
  id: Scalars["ID"]
}

export type MutationUpdateAuthorArgs = {
  data: AuthorInput
  id: Scalars["ID"]
}

export type MutationUpdateBookArgs = {
  data: BookInput
  id: Scalars["ID"]
}

export type MutationUpdateCategoryArgs = {
  data: CategoryInput
  id: Scalars["ID"]
}

export type MutationUpdateExperienceSectionArgs = {
  data: ExperienceSectionInput
}

export type MutationUpdateFileInfoArgs = {
  id: Scalars["ID"]
  info?: InputMaybe<FileInfoInput>
}

export type MutationUpdateGlobalArgs = {
  data: GlobalInput
}

export type MutationUpdateInterestItemArgs = {
  data: InterestItemInput
  id: Scalars["ID"]
}

export type MutationUpdateResourceSectionArgs = {
  data: ResourceSectionInput
}

export type MutationUpdateSideProjectArgs = {
  data: SideProjectInput
  id: Scalars["ID"]
}

export type MutationUpdateTechToolArgs = {
  data: TechToolInput
  id: Scalars["ID"]
}

export type MutationUpdateUploadFileArgs = {
  data: UploadFileInput
  id: Scalars["ID"]
}

export type MutationUpdateUploadFolderArgs = {
  data: UploadFolderInput
  id: Scalars["ID"]
}

export type MutationUpdateUsersPermissionsRoleArgs = {
  data: UsersPermissionsRoleInput
  id: Scalars["ID"]
}

export type MutationUpdateUsersPermissionsUserArgs = {
  data: UsersPermissionsUserInput
  id: Scalars["ID"]
}

export type MutationUpdateWebsiteArgs = {
  data: WebsiteInput
  id: Scalars["ID"]
}

export type MutationUpdateWorkExperienceArgs = {
  data: WorkExperienceInput
  id: Scalars["ID"]
}

export type MutationUploadArgs = {
  field?: InputMaybe<Scalars["String"]>
  file: Scalars["Upload"]
  info?: InputMaybe<FileInfoInput>
  ref?: InputMaybe<Scalars["String"]>
  refId?: InputMaybe<Scalars["ID"]>
}

export type Pagination = {
  __typename?: "Pagination"
  page: Scalars["Int"]
  pageCount: Scalars["Int"]
  pageSize: Scalars["Int"]
  total: Scalars["Int"]
}

export type PaginationArg = {
  limit?: InputMaybe<Scalars["Int"]>
  page?: InputMaybe<Scalars["Int"]>
  pageSize?: InputMaybe<Scalars["Int"]>
  start?: InputMaybe<Scalars["Int"]>
}

export enum PublicationState {
  Live = "LIVE",
  Preview = "PREVIEW",
}

export type Query = {
  __typename?: "Query"
  about?: Maybe<AboutEntityResponse>
  aboutSection?: Maybe<AboutSectionEntityResponse>
  article?: Maybe<ArticleEntityResponse>
  articles?: Maybe<ArticleEntityResponseCollection>
  author?: Maybe<AuthorEntityResponse>
  authors?: Maybe<AuthorEntityResponseCollection>
  book?: Maybe<BookEntityResponse>
  books?: Maybe<BookEntityResponseCollection>
  categories?: Maybe<CategoryEntityResponseCollection>
  category?: Maybe<CategoryEntityResponse>
  experienceSection?: Maybe<ExperienceSectionEntityResponse>
  global?: Maybe<GlobalEntityResponse>
  i18NLocale?: Maybe<I18NLocaleEntityResponse>
  i18NLocales?: Maybe<I18NLocaleEntityResponseCollection>
  interestItem?: Maybe<InterestItemEntityResponse>
  interestItems?: Maybe<InterestItemEntityResponseCollection>
  me?: Maybe<UsersPermissionsMe>
  resourceSection?: Maybe<ResourceSectionEntityResponse>
  sideProject?: Maybe<SideProjectEntityResponse>
  sideProjects?: Maybe<SideProjectEntityResponseCollection>
  techTool?: Maybe<TechToolEntityResponse>
  techTools?: Maybe<TechToolEntityResponseCollection>
  uploadFile?: Maybe<UploadFileEntityResponse>
  uploadFiles?: Maybe<UploadFileEntityResponseCollection>
  uploadFolder?: Maybe<UploadFolderEntityResponse>
  uploadFolders?: Maybe<UploadFolderEntityResponseCollection>
  usersPermissionsRole?: Maybe<UsersPermissionsRoleEntityResponse>
  usersPermissionsRoles?: Maybe<UsersPermissionsRoleEntityResponseCollection>
  usersPermissionsUser?: Maybe<UsersPermissionsUserEntityResponse>
  usersPermissionsUsers?: Maybe<UsersPermissionsUserEntityResponseCollection>
  website?: Maybe<WebsiteEntityResponse>
  websites?: Maybe<WebsiteEntityResponseCollection>
  workExperience?: Maybe<WorkExperienceEntityResponse>
  workExperiences?: Maybe<WorkExperienceEntityResponseCollection>
}

export type QueryAboutSectionArgs = {
  publicationState?: InputMaybe<PublicationState>
}

export type QueryArticleArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryArticlesArgs = {
  filters?: InputMaybe<ArticleFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryAuthorArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryAuthorsArgs = {
  filters?: InputMaybe<AuthorFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryBookArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryBooksArgs = {
  filters?: InputMaybe<BookFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryCategoriesArgs = {
  filters?: InputMaybe<CategoryFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryCategoryArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryExperienceSectionArgs = {
  publicationState?: InputMaybe<PublicationState>
}

export type QueryI18NLocaleArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryI18NLocalesArgs = {
  filters?: InputMaybe<I18NLocaleFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryInterestItemArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryInterestItemsArgs = {
  filters?: InputMaybe<InterestItemFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryResourceSectionArgs = {
  publicationState?: InputMaybe<PublicationState>
}

export type QuerySideProjectArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QuerySideProjectsArgs = {
  filters?: InputMaybe<SideProjectFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryTechToolArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryTechToolsArgs = {
  filters?: InputMaybe<TechToolFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryUploadFileArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryUploadFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryUploadFolderArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryUploadFoldersArgs = {
  filters?: InputMaybe<UploadFolderFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryUsersPermissionsRoleArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryUsersPermissionsRolesArgs = {
  filters?: InputMaybe<UsersPermissionsRoleFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryUsersPermissionsUserArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryUsersPermissionsUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryWebsiteArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryWebsitesArgs = {
  filters?: InputMaybe<WebsiteFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type QueryWorkExperienceArgs = {
  id?: InputMaybe<Scalars["ID"]>
}

export type QueryWorkExperiencesArgs = {
  filters?: InputMaybe<WorkExperienceFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ResourceSection = {
  __typename?: "ResourceSection"
  books?: Maybe<BookRelationResponseCollection>
  createdAt?: Maybe<Scalars["DateTime"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  section?: Maybe<ComponentComponentSection>
  updatedAt?: Maybe<Scalars["DateTime"]>
  websites?: Maybe<WebsiteRelationResponseCollection>
}

export type ResourceSectionBooksArgs = {
  filters?: InputMaybe<BookFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ResourceSectionWebsitesArgs = {
  filters?: InputMaybe<WebsiteFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type ResourceSectionEntity = {
  __typename?: "ResourceSectionEntity"
  attributes?: Maybe<ResourceSection>
  id?: Maybe<Scalars["ID"]>
}

export type ResourceSectionEntityResponse = {
  __typename?: "ResourceSectionEntityResponse"
  data?: Maybe<ResourceSectionEntity>
}

export type ResourceSectionInput = {
  books?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  section?: InputMaybe<ComponentComponentSectionInput>
  websites?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
}

export type ResponseCollectionMeta = {
  __typename?: "ResponseCollectionMeta"
  pagination: Pagination
}

export type SideProject = {
  __typename?: "SideProject"
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  name?: Maybe<Scalars["String"]>
  project_url?: Maybe<ComponentSharedUrl>
  publishedAt?: Maybe<Scalars["DateTime"]>
  tech_tools?: Maybe<TechToolRelationResponseCollection>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type SideProjectTech_ToolsArgs = {
  filters?: InputMaybe<TechToolFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  publicationState?: InputMaybe<PublicationState>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type SideProjectEntity = {
  __typename?: "SideProjectEntity"
  attributes?: Maybe<SideProject>
  id?: Maybe<Scalars["ID"]>
}

export type SideProjectEntityResponse = {
  __typename?: "SideProjectEntityResponse"
  data?: Maybe<SideProjectEntity>
}

export type SideProjectEntityResponseCollection = {
  __typename?: "SideProjectEntityResponseCollection"
  data: Array<SideProjectEntity>
  meta: ResponseCollectionMeta
}

export type SideProjectFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<SideProjectFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<SideProjectFiltersInput>
  or?: InputMaybe<Array<InputMaybe<SideProjectFiltersInput>>>
  project_url?: InputMaybe<ComponentSharedUrlFiltersInput>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  tech_tools?: InputMaybe<TechToolFiltersInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type SideProjectInput = {
  description?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
  project_url?: InputMaybe<ComponentSharedUrlInput>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  tech_tools?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
}

export type SideProjectRelationResponseCollection = {
  __typename?: "SideProjectRelationResponseCollection"
  data: Array<SideProjectEntity>
}

export type StringFilterInput = {
  and?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
  between?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
  contains?: InputMaybe<Scalars["String"]>
  containsi?: InputMaybe<Scalars["String"]>
  endsWith?: InputMaybe<Scalars["String"]>
  eq?: InputMaybe<Scalars["String"]>
  eqi?: InputMaybe<Scalars["String"]>
  gt?: InputMaybe<Scalars["String"]>
  gte?: InputMaybe<Scalars["String"]>
  in?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
  lt?: InputMaybe<Scalars["String"]>
  lte?: InputMaybe<Scalars["String"]>
  ne?: InputMaybe<Scalars["String"]>
  not?: InputMaybe<StringFilterInput>
  notContains?: InputMaybe<Scalars["String"]>
  notContainsi?: InputMaybe<Scalars["String"]>
  notIn?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
  notNull?: InputMaybe<Scalars["Boolean"]>
  null?: InputMaybe<Scalars["Boolean"]>
  or?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
  startsWith?: InputMaybe<Scalars["String"]>
}

export type TechTool = {
  __typename?: "TechTool"
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  homepage_url?: Maybe<Scalars["String"]>
  logo?: Maybe<UploadFileEntityResponse>
  name: Scalars["String"]
  publishedAt?: Maybe<Scalars["DateTime"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type TechToolEntity = {
  __typename?: "TechToolEntity"
  attributes?: Maybe<TechTool>
  id?: Maybe<Scalars["ID"]>
}

export type TechToolEntityResponse = {
  __typename?: "TechToolEntityResponse"
  data?: Maybe<TechToolEntity>
}

export type TechToolEntityResponseCollection = {
  __typename?: "TechToolEntityResponseCollection"
  data: Array<TechToolEntity>
  meta: ResponseCollectionMeta
}

export type TechToolFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<TechToolFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  homepage_url?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<TechToolFiltersInput>
  or?: InputMaybe<Array<InputMaybe<TechToolFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type TechToolInput = {
  description?: InputMaybe<Scalars["String"]>
  homepage_url?: InputMaybe<Scalars["String"]>
  logo?: InputMaybe<Scalars["ID"]>
  name?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
}

export type TechToolRelationResponseCollection = {
  __typename?: "TechToolRelationResponseCollection"
  data: Array<TechToolEntity>
}

export type UploadFile = {
  __typename?: "UploadFile"
  alternativeText?: Maybe<Scalars["String"]>
  caption?: Maybe<Scalars["String"]>
  createdAt?: Maybe<Scalars["DateTime"]>
  ext?: Maybe<Scalars["String"]>
  formats?: Maybe<Scalars["JSON"]>
  hash: Scalars["String"]
  height?: Maybe<Scalars["Int"]>
  mime: Scalars["String"]
  name: Scalars["String"]
  previewUrl?: Maybe<Scalars["String"]>
  provider: Scalars["String"]
  provider_metadata?: Maybe<Scalars["JSON"]>
  related?: Maybe<Array<Maybe<GenericMorph>>>
  size: Scalars["Float"]
  updatedAt?: Maybe<Scalars["DateTime"]>
  url: Scalars["String"]
  width?: Maybe<Scalars["Int"]>
}

export type UploadFileEntity = {
  __typename?: "UploadFileEntity"
  attributes?: Maybe<UploadFile>
  id?: Maybe<Scalars["ID"]>
}

export type UploadFileEntityResponse = {
  __typename?: "UploadFileEntityResponse"
  data?: Maybe<UploadFileEntity>
}

export type UploadFileEntityResponseCollection = {
  __typename?: "UploadFileEntityResponseCollection"
  data: Array<UploadFileEntity>
  meta: ResponseCollectionMeta
}

export type UploadFileFiltersInput = {
  alternativeText?: InputMaybe<StringFilterInput>
  and?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>
  caption?: InputMaybe<StringFilterInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  ext?: InputMaybe<StringFilterInput>
  folder?: InputMaybe<UploadFolderFiltersInput>
  folderPath?: InputMaybe<StringFilterInput>
  formats?: InputMaybe<JsonFilterInput>
  hash?: InputMaybe<StringFilterInput>
  height?: InputMaybe<IntFilterInput>
  id?: InputMaybe<IdFilterInput>
  mime?: InputMaybe<StringFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<UploadFileFiltersInput>
  or?: InputMaybe<Array<InputMaybe<UploadFileFiltersInput>>>
  previewUrl?: InputMaybe<StringFilterInput>
  provider?: InputMaybe<StringFilterInput>
  provider_metadata?: InputMaybe<JsonFilterInput>
  size?: InputMaybe<FloatFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
  url?: InputMaybe<StringFilterInput>
  width?: InputMaybe<IntFilterInput>
}

export type UploadFileInput = {
  alternativeText?: InputMaybe<Scalars["String"]>
  caption?: InputMaybe<Scalars["String"]>
  ext?: InputMaybe<Scalars["String"]>
  folder?: InputMaybe<Scalars["ID"]>
  folderPath?: InputMaybe<Scalars["String"]>
  formats?: InputMaybe<Scalars["JSON"]>
  hash?: InputMaybe<Scalars["String"]>
  height?: InputMaybe<Scalars["Int"]>
  mime?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
  previewUrl?: InputMaybe<Scalars["String"]>
  provider?: InputMaybe<Scalars["String"]>
  provider_metadata?: InputMaybe<Scalars["JSON"]>
  size?: InputMaybe<Scalars["Float"]>
  url?: InputMaybe<Scalars["String"]>
  width?: InputMaybe<Scalars["Int"]>
}

export type UploadFileRelationResponseCollection = {
  __typename?: "UploadFileRelationResponseCollection"
  data: Array<UploadFileEntity>
}

export type UploadFolder = {
  __typename?: "UploadFolder"
  children?: Maybe<UploadFolderRelationResponseCollection>
  createdAt?: Maybe<Scalars["DateTime"]>
  files?: Maybe<UploadFileRelationResponseCollection>
  name: Scalars["String"]
  parent?: Maybe<UploadFolderEntityResponse>
  path: Scalars["String"]
  pathId: Scalars["Int"]
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type UploadFolderChildrenArgs = {
  filters?: InputMaybe<UploadFolderFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type UploadFolderFilesArgs = {
  filters?: InputMaybe<UploadFileFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type UploadFolderEntity = {
  __typename?: "UploadFolderEntity"
  attributes?: Maybe<UploadFolder>
  id?: Maybe<Scalars["ID"]>
}

export type UploadFolderEntityResponse = {
  __typename?: "UploadFolderEntityResponse"
  data?: Maybe<UploadFolderEntity>
}

export type UploadFolderEntityResponseCollection = {
  __typename?: "UploadFolderEntityResponseCollection"
  data: Array<UploadFolderEntity>
  meta: ResponseCollectionMeta
}

export type UploadFolderFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UploadFolderFiltersInput>>>
  children?: InputMaybe<UploadFolderFiltersInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  files?: InputMaybe<UploadFileFiltersInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<UploadFolderFiltersInput>
  or?: InputMaybe<Array<InputMaybe<UploadFolderFiltersInput>>>
  parent?: InputMaybe<UploadFolderFiltersInput>
  path?: InputMaybe<StringFilterInput>
  pathId?: InputMaybe<IntFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type UploadFolderInput = {
  children?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  files?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  name?: InputMaybe<Scalars["String"]>
  parent?: InputMaybe<Scalars["ID"]>
  path?: InputMaybe<Scalars["String"]>
  pathId?: InputMaybe<Scalars["Int"]>
}

export type UploadFolderRelationResponseCollection = {
  __typename?: "UploadFolderRelationResponseCollection"
  data: Array<UploadFolderEntity>
}

export type UsersPermissionsCreateRolePayload = {
  __typename?: "UsersPermissionsCreateRolePayload"
  ok: Scalars["Boolean"]
}

export type UsersPermissionsDeleteRolePayload = {
  __typename?: "UsersPermissionsDeleteRolePayload"
  ok: Scalars["Boolean"]
}

export type UsersPermissionsLoginInput = {
  identifier: Scalars["String"]
  password: Scalars["String"]
  provider?: Scalars["String"]
}

export type UsersPermissionsLoginPayload = {
  __typename?: "UsersPermissionsLoginPayload"
  jwt?: Maybe<Scalars["String"]>
  user: UsersPermissionsMe
}

export type UsersPermissionsMe = {
  __typename?: "UsersPermissionsMe"
  blocked?: Maybe<Scalars["Boolean"]>
  confirmed?: Maybe<Scalars["Boolean"]>
  email?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  role?: Maybe<UsersPermissionsMeRole>
  username: Scalars["String"]
}

export type UsersPermissionsMeRole = {
  __typename?: "UsersPermissionsMeRole"
  description?: Maybe<Scalars["String"]>
  id: Scalars["ID"]
  name: Scalars["String"]
  type?: Maybe<Scalars["String"]>
}

export type UsersPermissionsPasswordPayload = {
  __typename?: "UsersPermissionsPasswordPayload"
  ok: Scalars["Boolean"]
}

export type UsersPermissionsPermission = {
  __typename?: "UsersPermissionsPermission"
  action: Scalars["String"]
  createdAt?: Maybe<Scalars["DateTime"]>
  role?: Maybe<UsersPermissionsRoleEntityResponse>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type UsersPermissionsPermissionEntity = {
  __typename?: "UsersPermissionsPermissionEntity"
  attributes?: Maybe<UsersPermissionsPermission>
  id?: Maybe<Scalars["ID"]>
}

export type UsersPermissionsPermissionFiltersInput = {
  action?: InputMaybe<StringFilterInput>
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  id?: InputMaybe<IdFilterInput>
  not?: InputMaybe<UsersPermissionsPermissionFiltersInput>
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsPermissionFiltersInput>>>
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type UsersPermissionsPermissionRelationResponseCollection = {
  __typename?: "UsersPermissionsPermissionRelationResponseCollection"
  data: Array<UsersPermissionsPermissionEntity>
}

export type UsersPermissionsRegisterInput = {
  email: Scalars["String"]
  password: Scalars["String"]
  username: Scalars["String"]
}

export type UsersPermissionsRole = {
  __typename?: "UsersPermissionsRole"
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  name: Scalars["String"]
  permissions?: Maybe<UsersPermissionsPermissionRelationResponseCollection>
  type?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
  users?: Maybe<UsersPermissionsUserRelationResponseCollection>
}

export type UsersPermissionsRolePermissionsArgs = {
  filters?: InputMaybe<UsersPermissionsPermissionFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type UsersPermissionsRoleUsersArgs = {
  filters?: InputMaybe<UsersPermissionsUserFiltersInput>
  pagination?: InputMaybe<PaginationArg>
  sort?: InputMaybe<Array<InputMaybe<Scalars["String"]>>>
}

export type UsersPermissionsRoleEntity = {
  __typename?: "UsersPermissionsRoleEntity"
  attributes?: Maybe<UsersPermissionsRole>
  id?: Maybe<Scalars["ID"]>
}

export type UsersPermissionsRoleEntityResponse = {
  __typename?: "UsersPermissionsRoleEntityResponse"
  data?: Maybe<UsersPermissionsRoleEntity>
}

export type UsersPermissionsRoleEntityResponseCollection = {
  __typename?: "UsersPermissionsRoleEntityResponseCollection"
  data: Array<UsersPermissionsRoleEntity>
  meta: ResponseCollectionMeta
}

export type UsersPermissionsRoleFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<UsersPermissionsRoleFiltersInput>
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsRoleFiltersInput>>>
  permissions?: InputMaybe<UsersPermissionsPermissionFiltersInput>
  type?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
  users?: InputMaybe<UsersPermissionsUserFiltersInput>
}

export type UsersPermissionsRoleInput = {
  description?: InputMaybe<Scalars["String"]>
  name?: InputMaybe<Scalars["String"]>
  permissions?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
  type?: InputMaybe<Scalars["String"]>
  users?: InputMaybe<Array<InputMaybe<Scalars["ID"]>>>
}

export type UsersPermissionsUpdateRolePayload = {
  __typename?: "UsersPermissionsUpdateRolePayload"
  ok: Scalars["Boolean"]
}

export type UsersPermissionsUser = {
  __typename?: "UsersPermissionsUser"
  blocked?: Maybe<Scalars["Boolean"]>
  confirmed?: Maybe<Scalars["Boolean"]>
  createdAt?: Maybe<Scalars["DateTime"]>
  email: Scalars["String"]
  provider?: Maybe<Scalars["String"]>
  role?: Maybe<UsersPermissionsRoleEntityResponse>
  updatedAt?: Maybe<Scalars["DateTime"]>
  username: Scalars["String"]
}

export type UsersPermissionsUserEntity = {
  __typename?: "UsersPermissionsUserEntity"
  attributes?: Maybe<UsersPermissionsUser>
  id?: Maybe<Scalars["ID"]>
}

export type UsersPermissionsUserEntityResponse = {
  __typename?: "UsersPermissionsUserEntityResponse"
  data?: Maybe<UsersPermissionsUserEntity>
}

export type UsersPermissionsUserEntityResponseCollection = {
  __typename?: "UsersPermissionsUserEntityResponseCollection"
  data: Array<UsersPermissionsUserEntity>
  meta: ResponseCollectionMeta
}

export type UsersPermissionsUserFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>
  blocked?: InputMaybe<BooleanFilterInput>
  confirmationToken?: InputMaybe<StringFilterInput>
  confirmed?: InputMaybe<BooleanFilterInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  email?: InputMaybe<StringFilterInput>
  id?: InputMaybe<IdFilterInput>
  not?: InputMaybe<UsersPermissionsUserFiltersInput>
  or?: InputMaybe<Array<InputMaybe<UsersPermissionsUserFiltersInput>>>
  password?: InputMaybe<StringFilterInput>
  provider?: InputMaybe<StringFilterInput>
  resetPasswordToken?: InputMaybe<StringFilterInput>
  role?: InputMaybe<UsersPermissionsRoleFiltersInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
  username?: InputMaybe<StringFilterInput>
}

export type UsersPermissionsUserInput = {
  blocked?: InputMaybe<Scalars["Boolean"]>
  confirmationToken?: InputMaybe<Scalars["String"]>
  confirmed?: InputMaybe<Scalars["Boolean"]>
  email?: InputMaybe<Scalars["String"]>
  password?: InputMaybe<Scalars["String"]>
  provider?: InputMaybe<Scalars["String"]>
  resetPasswordToken?: InputMaybe<Scalars["String"]>
  role?: InputMaybe<Scalars["ID"]>
  username?: InputMaybe<Scalars["String"]>
}

export type UsersPermissionsUserRelationResponseCollection = {
  __typename?: "UsersPermissionsUserRelationResponseCollection"
  data: Array<UsersPermissionsUserEntity>
}

export type Website = {
  __typename?: "Website"
  createdAt?: Maybe<Scalars["DateTime"]>
  name?: Maybe<Scalars["String"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  summary?: Maybe<Scalars["String"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
  url?: Maybe<ComponentSharedUrl>
}

export type WebsiteEntity = {
  __typename?: "WebsiteEntity"
  attributes?: Maybe<Website>
  id?: Maybe<Scalars["ID"]>
}

export type WebsiteEntityResponse = {
  __typename?: "WebsiteEntityResponse"
  data?: Maybe<WebsiteEntity>
}

export type WebsiteEntityResponseCollection = {
  __typename?: "WebsiteEntityResponseCollection"
  data: Array<WebsiteEntity>
  meta: ResponseCollectionMeta
}

export type WebsiteFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<WebsiteFiltersInput>>>
  createdAt?: InputMaybe<DateTimeFilterInput>
  id?: InputMaybe<IdFilterInput>
  name?: InputMaybe<StringFilterInput>
  not?: InputMaybe<WebsiteFiltersInput>
  or?: InputMaybe<Array<InputMaybe<WebsiteFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  summary?: InputMaybe<StringFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
  url?: InputMaybe<ComponentSharedUrlFiltersInput>
}

export type WebsiteInput = {
  name?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  summary?: InputMaybe<Scalars["String"]>
  url?: InputMaybe<ComponentSharedUrlInput>
}

export type WebsiteRelationResponseCollection = {
  __typename?: "WebsiteRelationResponseCollection"
  data: Array<WebsiteEntity>
}

export type WorkExperience = {
  __typename?: "WorkExperience"
  company_logo?: Maybe<UploadFileEntityResponse>
  company_name?: Maybe<Scalars["String"]>
  company_url?: Maybe<Scalars["String"]>
  createdAt?: Maybe<Scalars["DateTime"]>
  description?: Maybe<Scalars["String"]>
  end_date?: Maybe<Scalars["Date"]>
  job_subtitle?: Maybe<Scalars["String"]>
  job_title?: Maybe<Scalars["String"]>
  publishedAt?: Maybe<Scalars["DateTime"]>
  start_date?: Maybe<Scalars["Date"]>
  updatedAt?: Maybe<Scalars["DateTime"]>
}

export type WorkExperienceEntity = {
  __typename?: "WorkExperienceEntity"
  attributes?: Maybe<WorkExperience>
  id?: Maybe<Scalars["ID"]>
}

export type WorkExperienceEntityResponse = {
  __typename?: "WorkExperienceEntityResponse"
  data?: Maybe<WorkExperienceEntity>
}

export type WorkExperienceEntityResponseCollection = {
  __typename?: "WorkExperienceEntityResponseCollection"
  data: Array<WorkExperienceEntity>
  meta: ResponseCollectionMeta
}

export type WorkExperienceFiltersInput = {
  and?: InputMaybe<Array<InputMaybe<WorkExperienceFiltersInput>>>
  company_name?: InputMaybe<StringFilterInput>
  company_url?: InputMaybe<StringFilterInput>
  createdAt?: InputMaybe<DateTimeFilterInput>
  description?: InputMaybe<StringFilterInput>
  end_date?: InputMaybe<DateFilterInput>
  id?: InputMaybe<IdFilterInput>
  job_subtitle?: InputMaybe<StringFilterInput>
  job_title?: InputMaybe<StringFilterInput>
  not?: InputMaybe<WorkExperienceFiltersInput>
  or?: InputMaybe<Array<InputMaybe<WorkExperienceFiltersInput>>>
  publishedAt?: InputMaybe<DateTimeFilterInput>
  start_date?: InputMaybe<DateFilterInput>
  updatedAt?: InputMaybe<DateTimeFilterInput>
}

export type WorkExperienceInput = {
  company_logo?: InputMaybe<Scalars["ID"]>
  company_name?: InputMaybe<Scalars["String"]>
  company_url?: InputMaybe<Scalars["String"]>
  description?: InputMaybe<Scalars["String"]>
  end_date?: InputMaybe<Scalars["Date"]>
  job_subtitle?: InputMaybe<Scalars["String"]>
  job_title?: InputMaybe<Scalars["String"]>
  publishedAt?: InputMaybe<Scalars["DateTime"]>
  start_date?: InputMaybe<Scalars["Date"]>
}

export type WorkExperienceRelationResponseCollection = {
  __typename?: "WorkExperienceRelationResponseCollection"
  data: Array<WorkExperienceEntity>
}
