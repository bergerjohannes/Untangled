interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SimpleButton = ({ children, ...props }: SimpleButtonProps) => (
  <button className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base' {...props}>
    {children}
  </button>
)

export default SimpleButton
