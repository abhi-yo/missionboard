import { GeistSans } from 'geist/font/sans';
import localFont from 'next/font/local'

export const fonts = {
  sans: GeistSans,
};

export const satoshi = localFont({
  src: [
    {
      path: '../app/fonts/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2',
      style: 'normal',
      weight: '300 900',
    },
    {
      path: '../app/fonts/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-VariableItalic.woff2',
      style: 'italic',
      weight: '300 900',
    }
  ],
  variable: '--font-satoshi',
  display: 'swap',
})