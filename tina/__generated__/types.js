export function gql(strings, ...args) {
  let str = "";
  strings.forEach((string, i) => {
    str += string + (args[i] || "");
  });
  return str;
}
export const HomepagePartsFragmentDoc = gql`
    fragment HomepageParts on Homepage {
  __typename
  siteName
  navCtaLabel
  navLinks {
    __typename
    label
    href
  }
  hero {
    __typename
    kicker
    eyebrow
    titleLead
    titleAccent
    description
    primaryCtaLabel
    secondaryCtaLabel
    cursorLabel
    cursorYear
    modalTag
    modalTitle
    modalDescription
    backgroundVideo {
      __typename
      url
      path
      bucket
      mimeType
      size
      width
      height
      duration
      posterUrl
      title
      alt
    }
    showreelVideo {
      __typename
      url
      path
      bucket
      mimeType
      size
      width
      height
      duration
      posterUrl
      title
      alt
    }
    scrollLabel
  }
  marqueeItems
  servicesSection {
    __typename
    eyebrow
    titleLine1
    titleLine2
    description
    watchLabel
    services {
      __typename
      num
      name
      count
      desc
      items {
        __typename
        tag
        title
        video {
          __typename
          url
          path
          bucket
          mimeType
          size
          width
          height
          duration
          posterUrl
          title
          alt
        }
      }
    }
  }
  processSection {
    __typename
    eyebrow
    title
    steps {
      __typename
      num
      title
      text
    }
  }
  testimonialsSection {
    __typename
    eyebrow
    title
    badge
    items {
      __typename
      quote
      name
      role
      badge
    }
  }
  contactSection {
    __typename
    eyebrow
    titleLead
    titleAccent
    titleTrail
    description
    ctaLabel
    email
    socialHandle
  }
  footer {
    __typename
    tagline
    menuTitle
    legalTitle
    imprintLabel
    imprintHref
    privacyLabel
    privacyHref
    copyright
    credits
  }
}
    `;
export const HomepageDocument = gql`
    query homepage($relativePath: String!) {
  homepage(relativePath: $relativePath) {
    ... on Document {
      _sys {
        filename
        basename
        hasReferences
        breadcrumbs
        path
        relativePath
        extension
      }
      id
    }
    ...HomepageParts
  }
}
    ${HomepagePartsFragmentDoc}`;
export const HomepageConnectionDocument = gql`
    query homepageConnection($before: String, $after: String, $first: Float, $last: Float, $sort: String, $filter: HomepageFilter) {
  homepageConnection(
    before: $before
    after: $after
    first: $first
    last: $last
    sort: $sort
    filter: $filter
  ) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    totalCount
    edges {
      cursor
      node {
        ... on Document {
          _sys {
            filename
            basename
            hasReferences
            breadcrumbs
            path
            relativePath
            extension
          }
          id
        }
        ...HomepageParts
      }
    }
  }
}
    ${HomepagePartsFragmentDoc}`;
export function getSdk(requester) {
  return {
    homepage(variables, options) {
      return requester(HomepageDocument, variables, options);
    },
    homepageConnection(variables, options) {
      return requester(HomepageConnectionDocument, variables, options);
    }
  };
}
import { createClient } from "tinacms/dist/client";
const generateRequester = (client) => {
  const requester = async (doc, vars, options) => {
    let url = client.apiUrl;
    if (options?.branch) {
      const index = client.apiUrl.lastIndexOf("/");
      url = client.apiUrl.substring(0, index + 1) + options.branch;
    }
    const data = await client.request({
      query: doc,
      variables: vars,
      url
    }, options);
    return { data: data?.data, errors: data?.errors, query: doc, variables: vars || {} };
  };
  return requester;
};
export const ExperimentalGetTinaClient = () => getSdk(
  generateRequester(
    createClient({
      url: "/api/tina/gql",
      queries
    })
  )
);
export const queries = (client) => {
  const requester = generateRequester(client);
  return getSdk(requester);
};
