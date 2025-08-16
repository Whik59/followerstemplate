import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: 'media.istockphoto.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'www.junglescout.com' },
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'c.bonfireassets.com' },
      { protocol: 'https', hostname: 'www.pulsecarshalton.co.uk' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'www.ikea.com' },
    ],
  },
  transpilePackages: ['next-mdx-remote'],
  experimental: {
    // serverActions: true, // It's on by default in Next.js 14
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle PDF files
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      },
    });

    // Important: return the modified config
    return config;
  },
};

// Configure MDX
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, add it here, etc.
    remarkPlugins: [remarkGfm],
    // rehypePlugins: [],
  },
});

// nextConfig = withMDX(nextConfig); // Temporarily comment this out

const sentryConfig = {
  silent: true,
  org: "soft-gpt",
  project: "plush-friends",
};

export default withBundleAnalyzer(withSentryConfig(withNextIntl(nextConfig), sentryConfig)); 