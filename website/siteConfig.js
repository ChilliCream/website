/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config.html for all the possible

const siteConfig = {
  title: "ChilliCream",
  tagline: "We build hot & smooth software",
  url: "http://chillicream.com",
  cname: "chillicream.com",
  baseUrl: "/",
  gaTrackingId: "UA-72800164-1",
  projectName: "website",
  organizationName: "chillicream",
  repoUrl: "https://github.com/ChilliCream/website",
  headerLinks: [{
    blog: true,
    label: "Blog"
  }],
  headerIcon: "img/signet.png",
  footerIcon: "img/signet.png",
  favicon: "img/favicon.png",
  colors: {
    primaryColor: "#d51616",
    secondaryColor: "#432a19"
  },
  stylesheets: ["https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz:700,400"],
  copyright: "Copyright © " + new Date().getFullYear() + " ChilliCream",
  editUrl: "https://github.com/ChilliCream/website/edit/master/docs/",
  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks
    theme: "androidstudio"
  },
  scripts: ["https://buttons.github.io/buttons.js"],
  onPageNav: "separate",
  twitter: true,
  twitterUsername: "Chilli_Cream",
  twitterImage: "img/signet.png",
  cleanUrl: true,
  blogSidebarCount: "ALL",
  blogSidebarTitle: {
    default: "Recent posts",
    all: "All blog posts"
  }
};

module.exports = siteConfig;