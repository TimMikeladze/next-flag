export const getDefaultEnvironment = (): string =>
  (
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NEXT_PUBLIC_STAGE ||
    process.env.VERCEL_ENV ||
    process.env.ENV ||
    process.env.STAGE ||
    process.env.NODE_ENV
  )?.toLowerCase() as string;
