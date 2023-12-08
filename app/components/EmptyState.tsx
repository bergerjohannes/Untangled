import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'

const EmptyState = () => {
  return (
    <div className='my-12 bg-blackish lg:w-24 lg:h-24 w-20 h-20 text-2xl rounded-full cursor-text flex justify-center items-center animate-idle-shadow-movement shadow-light-lg'>
      <FontAwesomeIcon icon={faFolderOpen} />
    </div>
  )
}

export default EmptyState
