'use client';

import { useNextFlag } from 'next-flag/react';
import Image from 'next/image';
import styles from './page.module.css';

const ClientComponent = () => {
  const nf = useNextFlag();
  const nextLogo = nf.isFeatureEnabled('next-logo');

  if (nf.loading) {
    return null;
  }

  return (
    nextLogo && (
      <Image
        className={styles.logo}
        src="/next.svg"
        alt="Next.js Logo"
        width={180}
        height={37}
        priority
      />
    )
  );
};
export default ClientComponent;
