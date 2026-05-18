/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/hackathon/rules', destination: '/hackathon/resources', permanent: false },
      { source: '/ideas/create', destination: '/hackathon/my-projects?project=1', permanent: false },
      { source: '/profile', destination: '/hackathon/profile', permanent: false },
      /** Canonical project detail + share URLs live under `/hackathon/project/[id]` */
      { source: '/projects/:id/join', destination: '/hackathon/project/:id', permanent: false },
      { source: '/projects/:id', destination: '/hackathon/project/:id', permanent: false },
    ];
  },
};

export default nextConfig;

