/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // Jaga-jaga kalau pakai placeholder lain
      },
      // Nanti kalau sudah pakai Supabase Storage, tambahkan ini:
      // {
      //   protocol: 'https',
      //   hostname: 'xyz.supabase.co',
      // }
    ],
  },
};

export default nextConfig;
