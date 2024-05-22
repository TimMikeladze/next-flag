'use client';

import styles from './page.module.css';
import { NextFlagProvider, useNextFlag } from 'next-flag/react';

const ClientComponentWithContext = () => {
  return (
    <NextFlagProvider>
      <Component />
    </NextFlagProvider>
  );
};

const Component = () => {
  const nf = useNextFlag();
  const gettingStarted = nf.isFeatureEnabled('getting-started');
  return (
    <>
      {gettingStarted && (
        <p>
          Get started by editing&nbsp;
          <code className={styles.code}>src/app/page.tsx</code>
        </p>
      )}
    </>
  );
};

export default ClientComponentWithContext;
