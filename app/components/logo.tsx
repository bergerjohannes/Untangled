export const SimpleLogo = () => <Logo showText={false} />

export const LogoWithText = () => <Logo showText={true} />

interface LogoProps {
  showText: boolean
}

const Logo = ({ showText }: LogoProps) => (
  <div className='flex space-x-4 items-center'>
    <svg className='w-12 h-12' viewBox='0 0 62 62' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M50.7343 18.1956C50.6135 26.95 34.4269 24.2751 26.3487 21.8433C9.75108 14.7492 42.0713 9.05217 56.0946 24.4896C60.5992 29.9969 66.0602 41.7696 51.8667 44.8022C37.6733 47.8348 24.0586 38.1506 19.0255 32.9294C13.751 26.9929 13.5475 14.1331 31.9355 18.1956C54.9205 23.2737 48.4941 43.8009 38 44.8022C28.2723 45.7304 6.64012 48.3269 5.5 33.9999C3.85354 13.3102 41.6617 39.6389 19.0255 41.2976C7.51907 42.1407 9.59587 22.1075 29.5 33.4999C36.6071 37.5678 41.3122 47.4343 29.8971 58.2486C17.6593 69.8422 23.6537 41.4163 39.8627 35.5042C62.3815 28.1293 40.8977 63.0945 13.2122 49.5943C-13.7639 36.4399 9.24977 -6.31068 31.256 14.9055C38.9869 22.3589 37.3061 30.5 29.8971 30.5C22.9513 30.0709 5.6424 24.4897 3.51359 10.1914C0.84105 -7.75888 50.9347 3.67023 50.7343 18.1956Z'
        stroke='#F5F5F5' // "whitish"
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
    {showText && <h1 className='text-3xl font-bold'>UNTANGLED NOTES</h1>}
  </div>
)
