interface ProminentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ProminentButton = ({ children, ...props }: ProminentButtonProps) => (
  <button
    className='bg-blackish border-2 border-whitish py-2 px-8 rounded-default cursor-pointer hover:bg-whitish hover:text-blackish transition-colors duration-200'
    {...props}
  >
    {children}
  </button>
)

export default ProminentButton
