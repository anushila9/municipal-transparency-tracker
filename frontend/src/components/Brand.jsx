import emblem from '../assets/emblem.png'
import { SITE_NAME, SITE_TAGLINE } from '../lib/site.js'

/** Emblem + site name lockup, used by the public header, the admin sidebar and the login page. */
export default function Brand({ subtitle = SITE_TAGLINE, size = 'md' }) {
  const img = size === 'lg' ? 'h-14' : 'h-11'
  return (
    <span className="flex min-w-0 items-center gap-3">
      <img src={emblem} alt="Emblem of Nepal" width="47" height="44" className={`${img} w-auto shrink-0`} />
      <span className="min-w-0 leading-tight">
        <span className={`block font-semibold ${size === 'lg' ? 'text-lg' : 'text-[15px] min-[360px]:text-base'}`}>{SITE_NAME}</span>
        <span className="block text-xs text-white/75">{subtitle}</span>
      </span>
    </span>
  )
}
