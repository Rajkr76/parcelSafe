export default function sitemap() {
  return [
    {
      url: 'https://vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    {
      url: 'https://vercel.app/auth',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://vercel.app/onboarding',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
