const sizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function BrandMark({ tone = 'dark', size = 'md', className = '' }) {
  const onDark = tone === 'dark'
  const word = sizes[size] ?? sizes.md

  return (
    <div
      className={`font-brand whitespace-nowrap font-semibold leading-none tracking-[0.04em] ${
        onDark ? 'text-white' : 'text-stone-900'
      } ${word} ${className}`.trim()}
    >
      YORA{' '}
      <span className={`font-medium ${onDark ? 'text-teal-200/90' : 'text-teal-700'}`}>
        PERSONAL
      </span>
    </div>
  )
}
