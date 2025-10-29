import React from 'react';

import { GitHubIcon, TwitterIcon, WebsiteIcon } from './icons';

export type ContactField = {
  id: 'github' | 'twitter' | 'website';
  icon: React.ReactNode;
  prefix: string;
  placeholder: string;
};

export const contactFields: ContactField[] = [
  {
    id: 'website',
    icon: <WebsiteIcon />,
    prefix: 'https://',
    placeholder: 'your-website.com',
  },
  {
    id: 'twitter',
    icon: <TwitterIcon />,
    prefix: 'x.com/',
    placeholder: 'username',
  },
  {
    id: 'github',
    icon: <GitHubIcon />,
    prefix: 'github.com/',
    placeholder: 'username',
  },
];
