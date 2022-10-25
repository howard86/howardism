/* eslint-disable */
import * as Types from "../generated/types";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";
export type GetHomePageQueryVariables = Types.Exact<{ [key: string]: never }>;

export type GetHomePageQuery = {
  __typename?: "Query";
  aboutSection?: {
    __typename?: "AboutSectionEntityResponse";
    data?: {
      __typename?: "AboutSectionEntity";
      attributes?: {
        __typename?: "AboutSection";
        interest_title?: string;
        introduction?: string;
        section?: {
          __typename?: "ComponentComponentSection";
          title?: string;
          description?: string;
        };
        profile?: {
          __typename?: "UploadFileEntityResponse";
          data?: {
            __typename?: "UploadFileEntity";
            attributes?: { __typename?: "UploadFile"; url: string };
          };
        };
        interest_items?: {
          __typename?: "InterestItemRelationResponseCollection";
          data: Array<{
            __typename?: "InterestItemEntity";
            id?: string;
            attributes?: { __typename?: "InterestItem"; title?: string; description?: string };
          }>;
        };
      };
    };
  };
  experienceSection?: {
    __typename?: "ExperienceSectionEntityResponse";
    data?: {
      __typename?: "ExperienceSectionEntity";
      attributes?: {
        __typename?: "ExperienceSection";
        section?: {
          __typename?: "ComponentComponentSection";
          title?: string;
          description?: string;
        };
        side_projects?: {
          __typename?: "SideProjectRelationResponseCollection";
          data: Array<{
            __typename?: "SideProjectEntity";
            id?: string;
            attributes?: {
              __typename?: "SideProject";
              name?: string;
              description?: string;
              project_url?: { __typename?: "ComponentSharedUrl"; link: string };
              tech_tools?: {
                __typename?: "TechToolRelationResponseCollection";
                data: Array<{
                  __typename?: "TechToolEntity";
                  id?: string;
                  attributes?: { __typename?: "TechTool"; name: string };
                }>;
              };
            };
          }>;
        };
        work_experiences?: {
          __typename?: "WorkExperienceRelationResponseCollection";
          data: Array<{
            __typename?: "WorkExperienceEntity";
            id?: string;
            attributes?: {
              __typename?: "WorkExperience";
              job_title?: string;
              job_subtitle?: string;
              start_date?: string;
              end_date?: string;
              company_name?: string;
              company_url?: string;
              description?: string;
              company_logo?: {
                __typename?: "UploadFileEntityResponse";
                data?: {
                  __typename?: "UploadFileEntity";
                  attributes?: { __typename?: "UploadFile"; url: string };
                };
              };
            };
          }>;
        };
        tech_tools?: {
          __typename?: "TechToolRelationResponseCollection";
          data: Array<{
            __typename?: "TechToolEntity";
            id?: string;
            attributes?: {
              __typename?: "TechTool";
              name: string;
              description?: string;
              homepage_url?: string;
            };
          }>;
        };
      };
    };
  };
  resourceSection?: {
    __typename?: "ResourceSectionEntityResponse";
    data?: {
      __typename?: "ResourceSectionEntity";
      attributes?: {
        __typename?: "ResourceSection";
        section?: {
          __typename?: "ComponentComponentSection";
          title?: string;
          description?: string;
        };
        books?: {
          __typename?: "BookRelationResponseCollection";
          data: Array<{
            __typename?: "BookEntity";
            id?: string;
            attributes?: {
              __typename?: "Book";
              name?: string;
              author?: string;
              summary?: string;
              url?: { __typename?: "ComponentSharedUrl"; link: string };
            };
          }>;
        };
        websites?: {
          __typename?: "WebsiteRelationResponseCollection";
          data: Array<{
            __typename?: "WebsiteEntity";
            id?: string;
            attributes?: {
              __typename?: "Website";
              name?: string;
              summary?: string;
              url?: { __typename?: "ComponentSharedUrl"; link: string };
            };
          }>;
        };
      };
    };
  };
};

export type ImageFragment = {
  __typename?: "UploadFileEntityResponse";
  data?: {
    __typename?: "UploadFileEntity";
    attributes?: { __typename?: "UploadFile"; url: string };
  };
};

export type SectionFragment = {
  __typename?: "ComponentComponentSection";
  title?: string;
  description?: string;
};

export const ImageFragmentDoc = gql`
  fragment Image on UploadFileEntityResponse {
    data {
      attributes {
        url
      }
    }
  }
`;
export const SectionFragmentDoc = gql`
  fragment Section on ComponentComponentSection {
    title
    description
  }
`;
export const GetHomePageDocument = gql`
  query GetHomePage {
    aboutSection {
      data {
        attributes {
          section {
            ...Section
          }
          profile {
            ...Image
          }
          interest_title
          introduction
          interest_items {
            data {
              id
              attributes {
                title
                description
              }
            }
          }
        }
      }
    }
    experienceSection {
      data {
        attributes {
          section {
            ...Section
          }
          side_projects {
            data {
              id
              attributes {
                name
                description
                project_url {
                  link
                }
                tech_tools(pagination: { page: 1, pageSize: 3 }) {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
              }
            }
          }
          work_experiences {
            data {
              id
              attributes {
                job_title
                job_subtitle
                start_date
                end_date
                company_name
                company_url
                description
                company_logo {
                  ...Image
                }
              }
            }
          }
          tech_tools {
            data {
              id
              attributes {
                name
                description
                homepage_url
              }
            }
          }
        }
      }
    }
    resourceSection {
      data {
        attributes {
          section {
            ...Section
          }
          books {
            data {
              id
              attributes {
                name
                author
                summary
                url {
                  link
                }
              }
            }
          }
          websites {
            data {
              id
              attributes {
                name
                summary
                url {
                  link
                }
              }
            }
          }
        }
      }
    }
  }
  ${SectionFragmentDoc}
  ${ImageFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetHomePage(
      variables?: GetHomePageQueryVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<GetHomePageQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetHomePageQuery>(GetHomePageDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetHomePage",
        "query"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
