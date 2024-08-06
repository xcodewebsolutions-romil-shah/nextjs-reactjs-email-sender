'use strict'

/** @type {import('next').NextConfig} */

module.exports = {
  // exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
  //   return {
  //     '/': { page: '/' },
  //     '/[lang]/apps/user/email': { page: '/[lang]/apps/user/email' },
  //     '/[lang]/apps/user/list': { page: '/[lang]/apps/user/list' },
  //     '/[lang]/login': { page: '/[lang]/login' },
  //     '/api/auth/[...nextauth]': { page: '/api/auth/[...nextauth]', as: '/api/auth/*' },
  //     '/api/login': { page: '/api/login' }
  //   }
  // }
  async generateStaticParams() {
    // Define static paths for your app
    const staticPaths = [
      { params: { lang: 'en' }, locale: 'en' },
      { params: { lang: 'fr' }, locale: 'fr' }

      // Add other language paths as needed
    ]

    return staticPaths
  }
}
