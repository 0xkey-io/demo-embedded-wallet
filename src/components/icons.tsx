import { Command, Moon, SunMedium } from "lucide-react"

export type IconKeys = keyof typeof icons

type IconsType = {
  [key in IconKeys]: React.ElementType
}

type IconProps = React.HTMLAttributes<SVGElement>

const icons = {
  logo: Command,
  sun: SunMedium,
  moon: Moon,
  passwordLess: (props: IconProps) => (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 26 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.6248 1.32103C21.424 1.27441 21.2149 1.24976 21 1.24976H5C3.48122 1.24976 2.25 2.48097 2.25 3.99976V11.9998C2.25 12.1342 2.25965 12.2665 2.27831 12.3958L3.75 11.5533V3.99976C3.75 3.3094 4.30964 2.74976 5 2.74976H19.1289L21.6248 1.32103ZM6.82513 13.2498H21C21.6904 13.2498 22.25 12.6901 22.25 11.9998V4.41988L23.7181 3.57949C23.7391 3.71651 23.75 3.85686 23.75 3.99976V11.9998C23.75 13.5185 22.5188 14.7498 21 14.7498H5C4.7735 14.7498 4.5534 14.7224 4.34282 14.6707L6.82513 13.2498Z"
        fill="currentColor"
      />
      <path
        d="M13 7.99976H13.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 7.99976H18.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7.99976H8.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.683105 14.9998L24.9833 1.08927"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  ),
  google: (props: IconProps) => (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  ),
  ethereum: (props: IconProps) => (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
        fill="#627EEA"
      />
      <path
        d="M16.498 4V12.87L23.995 16.22L16.498 4Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path d="M16.498 4L9 16.22L16.498 12.87V4Z" fill="white" />
      <path
        d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z"
        fill="white"
        fillOpacity="0.602"
      />
      <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white" />
      <path
        d="M16.498 20.573L23.995 16.22L16.498 12.872V20.573Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M9 16.22L16.498 20.573V12.872L9 16.22Z"
        fill="white"
        fillOpacity="0.602"
      />
    </svg>
  ),
}

export const Icons: IconsType = icons
